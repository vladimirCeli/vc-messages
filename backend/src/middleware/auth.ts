import { verifyToken, type JWTPayload } from '../auth'

export async function authenticate(req: Request): Promise<JWTPayload | null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  return await verifyToken(token)
}
