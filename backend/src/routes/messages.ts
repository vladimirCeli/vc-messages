import { db } from '../db'
import { messages } from '../db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { messageCache } from '../redis'

export async function getMessages(conversationId: string) {
  const cached = await messageCache.getMessages(conversationId)
  if (cached.length > 0) {
    return { data: { messages: cached, cached: true }, status: 200 }
  }

  const msgs = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
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

  return { data: { messages: msgs.reverse(), cached: false }, status: 200 }
}
