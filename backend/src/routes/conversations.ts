import { db } from '../db'
import { conversations, conversationParticipants } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getConversations(userId: string) {
  const userConvs = await db
    .select({
      id: conversations.id,
      name: conversations.name,
      isGroup: conversations.isGroup,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId)
    )
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(desc(conversations.updatedAt))

  return { data: { conversations: userConvs }, status: 200 }
}
