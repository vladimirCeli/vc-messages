import { useState } from 'react'
import FormInput from './FormInput'

interface AuthFormProps {
  isLogin: boolean
  onSubmit: (data: AuthFormData) => Promise<void>
}

export interface AuthFormData {
  email: string
  username?: string
  password: string
  displayName?: string
}

export default function AuthForm({ isLogin, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({
        email,
        username: isLogin ? undefined : username,
        password,
        displayName: isLogin ? undefined : displayName,
      })
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="email"
        type="email"
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="your@email.com"
        required
      />

      {!isLogin && (
        <>
          <FormInput
            id="username"
            type="text"
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="username"
            required
          />
          <FormInput
            id="displayName"
            type="text"
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Your Name"
          />
        </>
      )}

      <FormInput
        id="password"
        type="password"
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        required
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {loading ? `${isLogin ? 'Logging in' : 'Creating account'}...` : (isLogin ? 'Login' : 'Create Account')}
      </button>
    </form>
  )
}
