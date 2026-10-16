import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMessages } from '../hooks/useMessages'
import { ws } from '../lib/websocket'
import type { WebSocketMessage } from '../lib/websocket'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { data: messages = [], isLoading } = useMessages(conversationId)
  const [typing, setTyping] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (!conversationId) return

    const handleWebSocketMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'user:typing':
          if (message.conversationId === conversationId && message.userId !== user?.id) {
            setTyping((prev) => new Set(prev).add(message.userId))
          }
          break
        case 'user:stopped_typing':
          if (message.conversationId === conversationId) {
            setTyping((prev) => {
              const newSet = new Set(prev)
              newSet.delete(message.userId)
              return newSet
            })
          }
          break
      }
    }

    const unsubscribe = ws.subscribe(handleWebSocketMessage)
    return unsubscribe
  }, [conversationId, user?.id])

  const handleSendMessage = (content: string) => {
    if (!conversationId) return
    ws.sendMessage(conversationId, content)
  }

  const handleTypingStart = () => {
    if (!conversationId) return
    ws.startTyping(conversationId)
  }

  const handleTypingStop = () => {
    if (!conversationId) return
    ws.stopTyping(conversationId)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <ChatHeader typingCount={typing.size} />
      <MessageList messages={messages} currentUserId={user?.id} isLoading={isLoading} />
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  )
}
