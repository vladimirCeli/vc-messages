/**
 * API Client for Messages VC Backend
 * Connects to ultra-fast Bun backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

class APIClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  getToken() {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async register(email: string, username: string, password: string, displayName?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, displayName }),
    })
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request<{ conversations: Conversation[] }>('/api/conversations')
  }

  // Messages
  async getMessages(conversationId: string): Promise<{ messages: Message[]; cached: boolean }> {
    return this.request<{ messages: Message[]; cached: boolean }>(
      `/api/conversations/${conversationId}/messages`
    )
  }
}

export const api = new APIClient()
