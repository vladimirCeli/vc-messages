import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createToken, hashPassword, verifyPassword } from '../auth'

export async function handleRegister(body: any) {
  const { email, username, password, displayName } = body

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existing) {
    return { error: 'User already exists', status: 400 }
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash,
      displayName: displayName || username,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
    })

  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  })

  return { data: { token, user }, status: 200 }
}

export async function handleLogin(body: any) {
  const { email, password } = body

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    return { error: 'Invalid credentials', status: 401 }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return { error: 'Invalid credentials', status: 401 }
  }

  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  })

  return {
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    },
    status: 200,
  }
}
