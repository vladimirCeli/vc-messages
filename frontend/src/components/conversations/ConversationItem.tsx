import type { Conversation } from '../../lib/api'

interface ConversationItemProps {
  conversation: Conversation
  onClick: () => void
}

export default function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full block bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
          {conversation.name?.charAt(0).toUpperCase() || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {conversation.name || `Conversation ${conversation.id.slice(0, 8)}`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {conversation.isGroup ? 'Group chat' : 'Direct message'}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(conversation.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </button>
  )
}
