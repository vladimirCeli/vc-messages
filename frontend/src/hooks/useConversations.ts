import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { conversations } = await api.getConversations()
      return conversations
    },
    staleTime: 30000, // 30 seconds (ultra-fast refresh)
    refetchOnWindowFocus: true,
  })
}
