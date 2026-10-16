import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useConversations } from '../hooks/useConversations'
import ConversationItem from '../components/conversations/ConversationItem'

export default function Conversations() {
  const { data: conversations = [], isLoading: loading } = useConversations()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {user?.displayName || user?.username}
              </h1>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-4">
          <div className="px-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Messages</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ultra-fast real-time chat
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No conversations yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new conversation to begin messaging
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
