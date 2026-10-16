import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { messages, conversations, conversationParticipants, users } from '../db/schema.js'
import { eq, and, desc, inArray } from 'drizzle-orm'

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().optional(),
  type: z.enum(['text', 'image', 'video', 'file']).default('text'),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  mediaSize: z.number().optional(),
  replyToId: z.string().uuid().optional(),
})

export async function messagesRoutes(app: FastifyInstance) {
  // Get messages for a conversation
  app.get<{ Params: { conversationId: string } }>(
    '/conversations/:conversationId/messages',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const { conversationId } = request.params

        // Verify user is participant
        const participant = await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, request.user!.userId)
          ),
        })

        if (!participant) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You are not a participant in this conversation',
          })
        }

        // Get messages
        const conversationMessages = await db.query.messages.findMany({
          where: and(
            eq(messages.conversationId, conversationId),
            eq(messages.isDeleted, false)
          ),
          orderBy: [desc(messages.createdAt)],
          limit: 100,
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

        return reply.send({ messages: conversationMessages.reverse() })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to fetch messages',
        })
      }
    }
  )

  // Send a message
  app.post(
    '/messages',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const body = sendMessageSchema.parse(request.body)

        // Verify user is participant
        const participant = await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, body.conversationId),
            eq(conversationParticipants.userId, request.user!.userId)
          ),
        })

        if (!participant) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You are not a participant in this conversation',
          })
        }

        // Create message
        const [message] = await db
          .insert(messages)
          .values({
            conversationId: body.conversationId,
            senderId: request.user!.userId,
            content: body.content,
            type: body.type,
            mediaUrl: body.mediaUrl,
            mediaType: body.mediaType,
            mediaSize: body.mediaSize,
            replyToId: body.replyToId,
          })
          .returning()

        // Get message with sender info
        const messageWithSender = await db.query.messages.findFirst({
          where: eq(messages.id, message.id),
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

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, body.conversationId))

        // Emit socket event (will be handled by Socket.IO)
        app.io.to(body.conversationId).emit('message:new', messageWithSender)

        return reply.send({ message: messageWithSender })
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
          message: 'Failed to send message',
        })
      }
    }
  )
}
