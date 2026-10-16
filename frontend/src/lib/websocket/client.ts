import type { WebSocketMessage, MessageHandler } from './types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'

class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: number | null = null

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(`${WS_URL}?token=${token}`)
    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }
    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handlers.forEach((handler) => handler(message))
      } catch {}
    }
    this.ws.onerror = () => {}
    this.ws.onclose = () => {
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
    }
  }

  sendMessage(conversationId: string, content: string, replyToId?: string) {
    this.send({
      type: 'message:send',
      conversationId,
      content,
      replyToId,
    })
  }

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

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, 25000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    this.reconnectAttempts++
    setTimeout(() => {
      this.connect(token)
    }, this.reconnectDelay * this.reconnectAttempts)
  }
}

export const ws = new WebSocketClient()
