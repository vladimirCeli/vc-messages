import { redis } from './client'
import { KEYS } from './keys'

export const unread = {
  async increment(userId: string, conversationId: string) {
    await redis.incr(KEYS.unread(userId, conversationId))
  },

  async reset(userId: string, conversationId: string) {
    await redis.del(KEYS.unread(userId, conversationId))
  },

  async getCount(userId: string, conversationId: string): Promise<number> {
    const count = await redis.get(KEYS.unread(userId, conversationId))
    return count ? parseInt(count) : 0
  },
}
