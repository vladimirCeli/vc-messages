import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
})

redis.on('error', (err) => console.error('Redis Error:', err))
redis.on('connect', () => console.log('Redis connected'))

await redis.connect()
