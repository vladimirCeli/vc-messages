import { redis } from './client'
import { KEYS } from './keys'

export const messageCache = {
  async cacheMessage(conversationId: string, message: any) {
    const key = KEYS.messageCache(conversationId)
    await redis.lPush(key, JSON.stringify(message))
    await redis.lTrim(key, 0, 49)
    await redis.expire(key, 3600)
  },

  async getMessages(conversationId: string): Promise<any[]> {
    const messages = await redis.lRange(KEYS.messageCache(conversationId), 0, -1)
    return messages.map(msg => JSON.parse(msg)).reverse()
  },

  async clear(conversationId: string) {
    await redis.del(KEYS.messageCache(conversationId))
  },
}
