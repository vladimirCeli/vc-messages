import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getMessages } from '../lib/api'
import type { Message } from '../lib/api'
import { ws } from '../lib/websocket'
import type { WebSocketMessage } from '../lib/websocket'

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const { messages } = await getMessages(conversationId)
      return messages
    },
    enabled: !!conversationId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!conversationId) return

    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'message:new' && message.message.conversationId === conversationId) {
        // Add new message to cache (ultra-fast update!)
        queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => [
          ...old,
          message.message,
        ])
      }
    }

    const unsubscribe = ws.subscribe(handleMessage)
    return () => {
      unsubscribe()
    }
  }, [conversationId, queryClient])

  return query
}
