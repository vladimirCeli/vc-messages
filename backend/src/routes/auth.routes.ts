import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body)

      // Check if user exists
      const existing = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      })

      if (existing) {
        return reply.code(400).send({
          error: 'User already exists',
          message: 'Email is already registered',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 12)

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: body.email,
          username: body.username,
          password: hashedPassword,
          displayName: body.displayName || body.username,
          status: 'online',
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })

      // Generate JWT
      const token = app.jwt.sign({
        userId: user.id,
        email: user.email,
        username: user.username,
      })

      return reply.send({
        token,
        user,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to register user',
      })
    }
  })

  // Login
  app.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      })

      if (!user) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        })
      }

      // Verify password
      const validPassword = await bcrypt.compare(body.password, user.password)

      if (!validPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        })
      }

      // Update status to online
      await db
        .update(users)
        .set({ status: 'online', updatedAt: new Date() })
        .where(eq(users.id, user.id))

      // Generate JWT
      const token = app.jwt.sign({
        userId: user.id,
        email: user.email,
        username: user.username,
      })

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          status: 'online',
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to login',
      })
    }
  })

  // Get current user
  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.user!.userId),
        columns: {
          password: false,
        },
      })

      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
        })
      }

      return reply.send({ user })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        error: 'Internal server error',
      })
    }
  })
}
