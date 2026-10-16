import { handleRegister, handleLogin } from './routes/auth'
import { getConversations } from './routes/conversations'
import { getMessages } from './routes/messages'
import { authenticate } from './middleware/auth'
import { jsonResponse } from './utils/response'

export async function handleHTTP(req: Request, url: URL): Promise<Response> {
  const path = url.pathname
  const method = req.method

  if (path === '/health') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() })
  }

  if (path === '/api/auth/register' && method === 'POST') {
    const body = await req.json()
    const result = await handleRegister(body)
    return jsonResponse(result.data || { error: result.error }, result.status)
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await req.json()
    const result = await handleLogin(body)
    return jsonResponse(result.data || { error: result.error }, result.status)
  }

  const authUser = await authenticate(req)
  if (!authUser && !path.startsWith('/api/auth')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (path === '/api/conversations' && method === 'GET' && authUser) {
    const result = await getConversations(authUser.userId)
    return jsonResponse(result.data, result.status)
  }

  if (path.startsWith('/api/conversations/') && path.endsWith('/messages') && method === 'GET' && authUser) {
    const convId = path.split('/')[3]
    const result = await getMessages(convId)
    return jsonResponse(result.data, result.status)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}
