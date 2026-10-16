import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { conversations, conversationParticipants, users, messages } from '../db/schema.js'
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm'

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
  isGroup: z.boolean().default(false),
  name: z.string().optional(),
})

export async function conversationsRoutes(app: FastifyInstance) {
  // Get user's conversations
  app.get(
    '/conversations',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        // Get conversations where user is a participant
        const userConversations = await db
          .select({
            id: conversations.id,
            name: conversations.name,
            isGroup: conversations.isGroup,
            avatarUrl: conversations.avatarUrl,
            createdAt: conversations.createdAt,
            updatedAt: conversations.updatedAt,
          })
          .from(conversations)
          .innerJoin(
            conversationParticipants,
            eq(conversations.id, conversationParticipants.conversationId)
          )
          .where(eq(conversationParticipants.userId, request.user!.userId))
          .orderBy(desc(conversations.updatedAt))

        // For each conversation, get participants and last message
        const conversationsWithDetails = await Promise.all(
          userConversations.map(async (conv) => {
            // Get participants
            const participants = await db
              .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
                status: users.status,
              })
              .from(users)
              .innerJoin(
                conversationParticipants,
                eq(users.id, conversationParticipants.userId)
              )
              .where(eq(conversationParticipants.conversationId, conv.id))

            // Get last message
            const lastMessage = await db.query.messages.findFirst({
              where: eq(messages.conversationId, conv.id),
              orderBy: [desc(messages.createdAt)],
              with: {
                sender: {
                  columns: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            })

            return {
              ...conv,
              participants,
              lastMessage,
            }
          })
        )

        return reply.send({ conversations: conversationsWithDetails })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to fetch conversations',
        })
      }
    }
  )

  // Create a new conversation
  app.post(
    '/conversations',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const body = createConversationSchema.parse(request.body)

        // Add current user to participants
        const allParticipantIds = [...new Set([request.user!.userId, ...body.participantIds])]

        // For direct messages (1-1), check if conversation already exists
        if (!body.isGroup && allParticipantIds.length === 2) {
          const existingConversation = await db
            .select({ id: conversations.id })
            .from(conversations)
            .innerJoin(
              conversationParticipants,
              eq(conversations.id, conversationParticipants.conversationId)
            )
            .where(
              and(
                eq(conversations.isGroup, false),
                inArray(conversationParticipants.userId, allParticipantIds)
              )
            )
            .groupBy(conversations.id)
            .having(sql`count(distinct ${conversationParticipants.userId}) = 2`)
            .limit(1)

          if (existingConversation.length > 0) {
            // Return existing conversation
            const existing = await db.query.conversations.findFirst({
              where: eq(conversations.id, existingConversation[0].id),
            })
            return reply.send({ conversation: existing })
          }
        }

        // Create conversation
        const [conversation] = await db
          .insert(conversations)
          .values({
            name: body.name,
            isGroup: body.isGroup,
            createdBy: request.user!.userId,
          })
          .returning()

        // Add participants
        await db.insert(conversationParticipants).values(
          allParticipantIds.map((userId) => ({
            conversationId: conversation.id,
            userId,
          }))
        )

        // Get full conversation with participants
        const participants = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            status: users.status,
          })
          .from(users)
          .innerJoin(
            conversationParticipants,
            eq(users.id, conversationParticipants.userId)
          )
          .where(eq(conversationParticipants.conversationId, conversation.id))

        return reply.send({
          conversation: {
            ...conversation,
            participants,
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
          message: 'Failed to create conversation',
        })
      }
    }
  )

  // Get all users (for starting new conversations)
  app.get('/users', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          status: users.status,
        })
        .from(users)
        .where(sql`${users.id} != ${request.user!.userId}`)

      return reply.send({ users: allUsers })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch users',
        })
    }
  })
}
