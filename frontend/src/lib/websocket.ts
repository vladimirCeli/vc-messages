/**
 * WebSocket Client for Messages VC
 * Connects to ultra-fast Bun WebSocket server
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'

export type WebSocketMessage =
  | { type: 'connected'; userId: string; message: string }
  | { type: 'user:online'; userId: string; username: string }
  | { type: 'user:offline'; userId: string }
  | { type: 'message:new'; message: any }
  | { type: 'user:typing'; userId: string; conversationId: string }
  | { type: 'user:stopped_typing'; userId: string; conversationId: string }
  | { type: 'error'; message: string }

export type MessageHandler = (message: WebSocketMessage) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: number | null = null

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    const url = `${WS_URL}?token=${token}`
    console.log('Connecting to WebSocket:', WS_URL)

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('📨 WebSocket message:', message)
        this.handlers.forEach((handler) => handler(message))
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected')
      this.stopHeartbeat()
      this.attemptReconnect(token)
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected')
    }
  }

  // Send a message
  sendMessage(conversationId: string, content: string, replyToId?: string) {
    this.send({
      type: 'message:send',
      conversationId,
      content,
      replyToId,
    })
  }

  // Typing indicators
  startTyping(conversationId: string) {
    this.send({
      type: 'typing:start',
      conversationId,
    })
  }

  stopTyping(conversationId: string) {
    this.send({
      type: 'typing:stop',
      conversationId,
    })
  }

  // Subscribe to messages
  subscribe(handler: MessageHandler) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  // Heartbeat to keep connection alive
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, 25000) // Every 25 seconds (Redis presence is 30s)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect(token)
    }, delay)
  }
}

export const ws = new WebSocketClient()
