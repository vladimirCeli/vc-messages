import { redis } from './client'
import { KEYS } from './keys'

export const presence = {
  async setOnline(userId: string, socketId: string) {
    await Promise.all([
      redis.set(KEYS.userOnline(userId), 'true', { EX: 30 }),
      redis.set(KEYS.userSocket(userId), socketId, { EX: 30 }),
    ])
  },

  async setOffline(userId: string) {
    await Promise.all([
      redis.del(KEYS.userOnline(userId)),
      redis.del(KEYS.userSocket(userId)),
    ])
  },

  async isOnline(userId: string): Promise<boolean> {
    const online = await redis.get(KEYS.userOnline(userId))
    return online === 'true'
  },

  async getSocketId(userId: string): Promise<string | null> {
    return await redis.get(KEYS.userSocket(userId))
  },

  async heartbeat(userId: string) {
    await redis.expire(KEYS.userOnline(userId), 30)
    await redis.expire(KEYS.userSocket(userId), 30)
  },
}
