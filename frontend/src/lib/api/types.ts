export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Conversation {
  id: string
  name?: string
  isGroup: boolean
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  createdAt: string
  sender?: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}
