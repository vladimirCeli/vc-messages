import { useQuery } from '@tanstack/react-query'
import { getConversations } from '../lib/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { conversations } = await getConversations()
      return conversations
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
}
