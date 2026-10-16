import { apiClient } from './client'
import type { Message } from './types'

export async function getMessages(conversationId: string): Promise<{ messages: Message[]; cached: boolean }> {
  return apiClient.request<{ messages: Message[]; cached: boolean }>(
    `/api/conversations/${conversationId}/messages`
  )
}
