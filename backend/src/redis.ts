import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client with optimizations
export const redis = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
})

redis.on('error', (err) => console.error('Redis Error:', err))
redis.on('connect', () => console.log('✅ Redis connected'))

// Connect to Redis
await redis.connect()

/**
 * Redis key prefixes for organization
 */
const KEYS = {
  // User presence: online:userId
  userOnline: (userId: string) => `online:${userId}`,
  // User socket: socket:userId
  userSocket: (userId: string) => `socket:${userId}`,
  // Typing indicator: typing:conversationId
  typing: (convId: string) => `typing:${convId}`,
  // Message cache: messages:conversationId
  messageCache: (convId: string) => `messages:${convId}`,
  // Unread count: unread:userId:convId
  unread: (userId: string, convId: string) => `unread:${userId}:${convId}`,
}

/**
 * User presence management
 */
export const presence = {
  // Set user online
  async setOnline(userId: string, socketId: string) {
    await Promise.all([
      redis.set(KEYS.userOnline(userId), 'true', { EX: 30 }), // expires in 30s
      redis.set(KEYS.userSocket(userId), socketId, { EX: 30 }),
    ])
  },

  // Set user offline
  async setOffline(userId: string) {
    await Promise.all([
      redis.del(KEYS.userOnline(userId)),
      redis.del(KEYS.userSocket(userId)),
    ])
  },

  // Check if user is online
  async isOnline(userId: string): Promise<boolean> {
    const online = await redis.get(KEYS.userOnline(userId))
    return online === 'true'
  },

  // Get user's socket ID
  async getSocketId(userId: string): Promise<string | null> {
    return await redis.get(KEYS.userSocket(userId))
  },

  // Heartbeat to keep user online
  async heartbeat(userId: string) {
    await redis.expire(KEYS.userOnline(userId), 30)
    await redis.expire(KEYS.userSocket(userId), 30)
  },
}

/**
 * Typing indicators
 */
export const typing = {
  // Set user typing
  async setTyping(conversationId: string, userId: string) {
    await redis.sAdd(KEYS.typing(conversationId), userId)
    await redis.expire(KEYS.typing(conversationId), 5) // 5 seconds
  },

  // Remove user typing
  async stopTyping(conversationId: string, userId: string) {
    await redis.sRem(KEYS.typing(conversationId), userId)
  },

  // Get who is typing
  async getTyping(conversationId: string): Promise<string[]> {
    return await redis.sMembers(KEYS.typing(conversationId))
  },
}

/**
 * Message caching (last 50 messages per conversation)
 */
export const messageCache = {
  // Cache a message
  async cacheMessage(conversationId: string, message: any) {
    const key = KEYS.messageCache(conversationId)
    await redis.lPush(key, JSON.stringify(message))
    await redis.lTrim(key, 0, 49) // keep only last 50
    await redis.expire(key, 3600) // 1 hour
  },

  // Get cached messages
  async getMessages(conversationId: string): Promise<any[]> {
    const messages = await redis.lRange(KEYS.messageCache(conversationId), 0, -1)
    return messages.map(msg => JSON.parse(msg)).reverse()
  },

  // Clear cache
  async clear(conversationId: string) {
    await redis.del(KEYS.messageCache(conversationId))
  },
}

/**
 * Unread counts
 */
export const unread = {
  // Increment unread count
  async increment(userId: string, conversationId: string) {
    await redis.incr(KEYS.unread(userId, conversationId))
  },

  // Reset unread count
  async reset(userId: string, conversationId: string) {
    await redis.del(KEYS.unread(userId, conversationId))
  },

  // Get unread count
  async getCount(userId: string, conversationId: string): Promise<number> {
    const count = await redis.get(KEYS.unread(userId, conversationId))
    return count ? parseInt(count) : 0
  },
}
