import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMessages } from '../hooks/useMessages'
import { ws } from '../lib/websocket'
import type { WebSocketMessage } from '../lib/websocket'

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { data: messages = [], isLoading: loading } = useMessages(conversationId)
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle typing indicators
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
    return () => {
      unsubscribe()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId, user?.id])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId) return

    ws.sendMessage(conversationId, newMessage.trim())
    setNewMessage('')
    ws.stopTyping(conversationId)
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (!conversationId) return

    // Notify typing
    if (e.target.value) {
      ws.startTyping(conversationId)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        ws.stopTyping(conversationId)
      }, 3000)
    } else {
      ws.stopTyping(conversationId)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">
              Conversation
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {typing.size > 0 ? 'typing...' : 'Online'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === user?.id

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {message.sender?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    {!isOwn && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-3">
                        {message.sender?.displayName || message.sender?.username || 'Unknown'}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  )
}
