import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { setupSocketIO } from './socket/index.js'
import { authenticate } from './middleware/auth.js'
import { authRoutes } from './routes/auth.routes.js'
import { conversationsRoutes } from './routes/conversations.routes.js'
import { messagesRoutes } from './routes/messages.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create Fastify instance
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

// Create HTTP server for Socket.IO
const httpServer = createServer(app.server)

// Setup Socket.IO
const io = setupSocketIO(httpServer, app)

// Make io available in routes
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate
    io: typeof io
  }
}

app.decorate('io', io)
app.decorate('authenticate', authenticate)

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
})

await app.register(helmet, {
  contentSecurityPolicy: false,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

await app.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
})

// Static files for uploads
await app.register(fastifyStatic, {
  root: join(__dirname, '../uploads'),
  prefix: '/uploads/',
})

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Register routes
await app.register(authRoutes, { prefix: '/api' })
await app.register(conversationsRoutes, { prefix: '/api' })
await app.register(messagesRoutes, { prefix: '/api' })

// Start server
const PORT = parseInt(process.env.PORT || '3000')
const HOST = process.env.HOST || '0.0.0.0'

httpServer.listen(PORT, HOST, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`🚀 Messages VC server running on http://${HOST}:${PORT}`)
  app.log.info(`📡 Socket.IO server ready`)
})

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']

signals.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, closing server...`)

    io.close(() => {
      app.log.info('Socket.IO connections closed')
    })

    await app.close()
    process.exit(0)
  })
})
