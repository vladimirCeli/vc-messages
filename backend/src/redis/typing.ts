import { redis } from './client'
import { KEYS } from './keys'

export const typing = {
  async setTyping(conversationId: string, userId: string) {
    await redis.sAdd(KEYS.typing(conversationId), userId)
    await redis.expire(KEYS.typing(conversationId), 5)
  },

  async stopTyping(conversationId: string, userId: string) {
    await redis.sRem(KEYS.typing(conversationId), userId)
  },

  async getTyping(conversationId: string): Promise<string[]> {
    return await redis.sMembers(KEYS.typing(conversationId))
  },
}
