import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { users, conversationParticipants } from '../db/schema.js'
import { eq } from 'drizzle-orm'

interface SocketData {
  userId?: string
  username?: string
}

export function setupSocketIO(httpServer: HTTPServer, app: FastifyInstance) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  })

  // Store socket connections by userId
  const userSockets = new Map<string, string>() // userId -> socketId

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Authenticate
    socket.on('auth', async (token: string) => {
      try {
        const decoded = app.jwt.verify(token) as any

        if (!decoded || !decoded.userId) {
          socket.emit('auth:error', { message: 'Invalid token' })
          return
        }

        socket.data.userId = decoded.userId
        socket.data.username = decoded.username

        // Store socket connection
        userSockets.set(decoded.userId, socket.id)

        // Update user status to online
        await db
          .update(users)
          .set({ status: 'online', lastSeen: new Date() })
          .where(eq(users.id, decoded.userId))

        // Get user's conversations
        const userConversations = await db
          .select({ conversationId: conversationParticipants.conversationId })
          .from(conversationParticipants)
          .where(eq(conversationParticipants.userId, decoded.userId))

        // Join conversation rooms
        userConversations.forEach((conv) => {
          socket.join(conv.conversationId)
        })

        socket.emit('auth:success', { userId: decoded.userId })

        // Broadcast user online status
        io.emit('user:status', {
          userId: decoded.userId,
          status: 'online',
        })
      } catch (error) {
        console.error('Auth error:', error)
        socket.emit('auth:error', { message: 'Authentication failed' })
      }
    })

    // Join a conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(conversationId)
      console.log(`User ${socket.data.userId} joined conversation ${conversationId}`)
    })

    // Leave a conversation room
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(conversationId)
      console.log(`User ${socket.data.userId} left conversation ${conversationId}`)
    })

    // Typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('user:typing', {
        userId: socket.data.userId,
        username: socket.data.username,
        conversationId,
      })
    })

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user:stopped_typing', {
        userId: socket.data.userId,
        conversationId,
      })
    })

    // Message read receipt
    socket.on('message:read', async ({ messageId, conversationId }) => {
      socket.to(conversationId).emit('message:read_receipt', {
        messageId,
        userId: socket.data.userId,
        readAt: new Date(),
      })
    })

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)

      if (socket.data.userId) {
        userSockets.delete(socket.data.userId)

        // Update user status to offline
        await db
          .update(users)
          .set({ status: 'offline', lastSeen: new Date() })
          .where(eq(users.id, socket.data.userId))

        // Broadcast user offline status
        io.emit('user:status', {
          userId: socket.data.userId,
          status: 'offline',
        })
      }
    })
  })

  return io
}
