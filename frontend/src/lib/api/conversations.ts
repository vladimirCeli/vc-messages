import { apiClient } from './client'
import type { Conversation } from './types'

export async function getConversations(): Promise<{ conversations: Conversation[] }> {
  return apiClient.request<{ conversations: Conversation[] }>('/api/conversations')
}
