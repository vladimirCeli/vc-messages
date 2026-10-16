import { db } from '../db'
import { messages } from '../db/schema'
import { typing, messageCache } from '../redis'
import { broadcast, getConnection } from './connections'
import { db as database } from '../db'
import { conversationParticipants } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function handleMessage(ws: any, data: any) {
  const { userId } = ws.data
  const { type, ...payload } = data

  switch (type) {
    case 'message:send':
      await handleSendMessage(userId, payload)
      break
    case 'typing:start':
      await handleTypingStart(userId, payload)
      break
    case 'typing:stop':
      await handleTypingStop(userId, payload)
      break
    case 'heartbeat':
      // Heartbeat handled by presence
      break
  }
}

async function handleSendMessage(userId: string, payload: any) {
  const { conversationId, content, replyToId } = payload

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

  await messageCache.cacheMessage(conversationId, message)
  await broadcastToConversation(conversationId, {
    type: 'message:new',
    message,
  })
}

async function handleTypingStart(userId: string, payload: any) {
  const { conversationId } = payload
  await typing.setTyping(conversationId, userId)
  await broadcastToConversation(conversationId, {
    type: 'user:typing',
    userId,
    conversationId,
  }, userId)
}

async function handleTypingStop(userId: string, payload: any) {
  const { conversationId } = payload
  await typing.stopTyping(conversationId, userId)
  await broadcastToConversation(conversationId, {
    type: 'user:stopped_typing',
    userId,
    conversationId,
  }, userId)
}

async function broadcastToConversation(conversationId: string, message: any, excludeUserId?: string) {
  const participants = await database
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId))

  const payload = JSON.stringify(message)

  participants.forEach(({ userId }) => {
    if (userId === excludeUserId) return
    const ws = getConnection(userId)
    if (ws) ws.send(payload)
  })
}
