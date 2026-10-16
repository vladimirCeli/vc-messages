import { Server } from 'bun'
import { db } from './db'
import { users, messages, conversations, conversationParticipants } from './db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { createToken, verifyToken, hashPassword, verifyPassword, type JWTPayload } from './auth'
import { presence, typing, messageCache } from './redis'

// Store WebSocket connections
const connections = new Map<string, any>() // userId -> WebSocket

const PORT = parseInt(process.env.PORT || '3000')
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

/**
 * Ultra-fast server with Bun.serve + native WebSockets
 */
const server = Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url)

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    // Upgrade to WebSocket
    if (url.pathname === '/ws') {
      const token = url.searchParams.get('token')
      if (!token) {
        return new Response('Missing token', { status: 401 })
      }

      const payload = await verifyToken(token)
      if (!payload) {
        return new Response('Invalid token', { status: 401 })
      }

      const upgraded = server.upgrade(req, {
        data: { userId: payload.userId, username: payload.username },
      })

      return upgraded ? undefined : new Response('WebSocket upgrade failed', { status: 500 })
    }

    // API Routes
    try {
      const response = await handleHTTP(req, url)
      // Add CORS headers to response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }
  },

  websocket: {
    async open(ws) {
      const { userId, username } = ws.data
      console.log(`✅ WebSocket connected: ${username} (${userId})`)

      // Store connection
      connections.set(userId, ws)

      // Set user online in Redis
      await presence.setOnline(userId, userId)

      // Notify others user is online
      broadcast({
        type: 'user:online',
        userId,
        username,
      })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        userId,
        message: 'Connected to Messages VC',
      }))
    },

    async message(ws, message) {
      try {
        const data = JSON.parse(message as string)
        await handleWebSocketMessage(ws, data)
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
      }
    },

    async close(ws) {
      const { userId, username } = ws.data
      console.log(`❌ WebSocket disconnected: ${username}`)

      // Remove connection
      connections.delete(userId)

      // Set user offline
      await presence.setOffline(userId)

      // Notify others user is offline
      broadcast({
        type: 'user:offline',
        userId,
      })
    },
  },
})

/**
 * Handle HTTP requests (REST API)
 */
async function handleHTTP(req: Request, url: URL): Promise<Response> {
  const path = url.pathname
  const method = req.method

  // Health check
  if (path === '/health') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() })
  }

  // Auth routes
  if (path === '/api/auth/register' && method === 'POST') {
    const body = await req.json()
    const { email, username, password, displayName } = body

    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existing) {
      return jsonResponse({ error: 'User already exists' }, 400)
    }

    // Hash password with Argon2 (faster than bcrypt!)
    const passwordHash = await hashPassword(password)

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
        displayName: displayName || username,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        displayName: users.displayName,
      })

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    return jsonResponse({ token, user })
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await req.json()
    const { email, password } = body

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return jsonResponse({ error: 'Invalid credentials' }, 401)
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return jsonResponse({ error: 'Invalid credentials' }, 401)
    }

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    })
  }

  // Protected routes (require auth)
  const authUser = await authenticate(req)
  if (!authUser && !path.startsWith('/api/auth')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // Get conversations
  if (path === '/api/conversations' && method === 'GET' && authUser) {
    const userConvs = await db
      .select({
        id: conversations.id,
        name: conversations.name,
        isGroup: conversations.isGroup,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(eq(conversationParticipants.userId, authUser.userId))
      .orderBy(desc(conversations.updatedAt))

    return jsonResponse({ conversations: userConvs })
  }

  // Get messages for conversation
  if (path.startsWith('/api/conversations/') && path.endsWith('/messages') && method === 'GET' && authUser) {
    const convId = path.split('/')[3]

    // Try cache first (FAST!)
    const cached = await messageCache.getMessages(convId)
    if (cached.length > 0) {
      return jsonResponse({ messages: cached, cached: true })
    }

    // Fallback to database
    const msgs = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, convId),
        eq(messages.isDeleted, false)
      ),
      orderBy: [desc(messages.createdAt)],
      limit: 50,
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return jsonResponse({ messages: msgs.reverse(), cached: false })
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

/**
 * Handle WebSocket messages
 */
async function handleWebSocketMessage(ws: any, data: any) {
  const { userId } = ws.data
  const { type, ...payload } = data

  switch (type) {
    case 'message:send': {
      const { conversationId, content, replyToId } = payload

      // Save to database
      const [message] = await db
        .insert(messages)
        .values({
          conversationId,
          senderId: userId,
          content,
          replyToId,
          type: 'text',
        })
        .returning()

      // Cache message
      await messageCache.cacheMessage(conversationId, message)

      // Broadcast to conversation participants
      await broadcastToConversation(conversationId, {
        type: 'message:new',
        message,
      })
      break
    }

    case 'typing:start': {
      const { conversationId } = payload
      await typing.setTyping(conversationId, userId)
      await broadcastToConversation(conversationId, {
        type: 'user:typing',
        userId,
        conversationId,
      }, userId)
      break
    }

    case 'typing:stop': {
      const { conversationId } = payload
      await typing.stopTyping(conversationId, userId)
      await broadcastToConversation(conversationId, {
        type: 'user:stopped_typing',
        userId,
        conversationId,
      }, userId)
      break
    }

    case 'heartbeat': {
      await presence.heartbeat(userId)
      break
    }
  }
}

/**
 * Helper functions
 */
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function authenticate(req: Request): Promise<JWTPayload | null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  return await verifyToken(token)
}

function broadcast(message: any) {
  const payload = JSON.stringify(message)
  connections.forEach(ws => ws.send(payload))
}

async function broadcastToConversation(conversationId: string, message: any, excludeUserId?: string) {
  // Get participants
  const participants = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId))

  const payload = JSON.stringify(message)

  participants.forEach(({ userId }) => {
    if (userId === excludeUserId) return
    const ws = connections.get(userId)
    if (ws) ws.send(payload)
  })
}

console.log(`🚀 Messages VC server running on http://localhost:${PORT}`)
console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`)
console.log(`⚡ Powered by Bun (ultra-fast runtime)`)
