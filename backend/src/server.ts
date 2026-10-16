import { verifyToken } from './auth'
import { PORT } from './config/env'
import { corsHeaders, applyCorsHeaders } from './config/cors'
import { addConnection, removeConnection, broadcast } from './websocket/connections'
import { handleMessage } from './websocket/handlers'
import { handleHTTP } from './router'
import { presence } from './redis'

const server = Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

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

    try {
      const response = await handleHTTP(req, url)
      return applyCorsHeaders(response)
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },

  websocket: {
    async open(ws) {
      const { userId, username } = ws.data
      console.log(`WebSocket connected: ${username} (${userId})`)

      addConnection(userId, ws)
      await presence.setOnline(userId, userId)

      broadcast({
        type: 'user:online',
        userId,
        username,
      })

      ws.send(JSON.stringify({
        type: 'connected',
        userId,
        message: 'Connected to Messages VC',
      }))
    },

    async message(ws, message) {
      try {
        const data = JSON.parse(message as string)
        await handleMessage(ws, data)
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
      }
    },

    async close(ws) {
      const { userId, username } = ws.data
      console.log(`WebSocket disconnected: ${username}`)

      removeConnection(userId)
      await presence.setOffline(userId)

      broadcast({
        type: 'user:offline',
        userId,
      })
    },
  },
})

console.log(`Messages VC server running on http://localhost:${PORT}`)
console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`)
console.log(`Powered by Bun (ultra-fast runtime)`)
