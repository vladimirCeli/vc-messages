import { useRef, useEffect } from 'react'
import type { Message as MessageType } from '../../lib/api'
import Message from './Message'

interface MessageListProps {
  messages: MessageType[]
  currentUserId?: string
  isLoading: boolean
}

export default function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  )
}
