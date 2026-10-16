import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  onTypingStart: () => void
  onTypingStop: () => void
}

export default function MessageInput({ onSendMessage, onTypingStart, onTypingStop }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const typingTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    if (e.target.value) {
      onTypingStart()

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        onTypingStop()
      }, 3000)
    } else {
      onTypingStop()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    onSendMessage(message.trim())
    setMessage('')
    onTypingStop()
  }

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </footer>
  )
}
