export type WebSocketMessage =
  | { type: 'connected'; userId: string; message: string }
  | { type: 'user:online'; userId: string; username: string }
  | { type: 'user:offline'; userId: string }
  | { type: 'message:new'; message: any }
  | { type: 'user:typing'; userId: string; conversationId: string }
  | { type: 'user:stopped_typing'; userId: string; conversationId: string }
  | { type: 'error'; message: string }

export type MessageHandler = (message: WebSocketMessage) => void
