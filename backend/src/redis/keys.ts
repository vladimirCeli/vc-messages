export const KEYS = {
  userOnline: (userId: string) => `online:${userId}`,
  userSocket: (userId: string) => `socket:${userId}`,
  typing: (convId: string) => `typing:${convId}`,
  messageCache: (convId: string) => `messages:${convId}`,
  unread: (userId: string, convId: string) => `unread:${userId}:${convId}`,
}
