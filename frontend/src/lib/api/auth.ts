import { apiClient } from './client'
import type { AuthResponse } from './types'

export async function register(
  email: string,
  username: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  return apiClient.request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password, displayName }),
  })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiClient.request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
