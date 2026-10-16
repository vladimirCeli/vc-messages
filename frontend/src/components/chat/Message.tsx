import type { Message as MessageType } from '../../lib/api'

interface MessageProps {
  message: MessageType
  isOwn: boolean
}

export default function Message({ message, isOwn }: MessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
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
}
