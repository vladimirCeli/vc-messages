import { useNavigate } from 'react-router-dom'

interface ChatHeaderProps {
  typingCount: number
}

export default function ChatHeader({ typingCount }: ChatHeaderProps) {
  const navigate = useNavigate()

  return (
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
            {typingCount > 0 ? 'typing...' : 'Online'}
          </p>
        </div>
      </div>
    </header>
  )
}
