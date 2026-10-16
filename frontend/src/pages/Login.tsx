import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthToggle from '../components/auth/AuthToggle'
import AuthForm, { type AuthFormData } from '../components/auth/AuthForm'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (data: AuthFormData) => {
    if (isLogin) {
      await login(data.email, data.password)
    } else {
      await register(data.email, data.username!, data.password, data.displayName)
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Messages VC
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ultra-fast real-time messaging
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            10-20ms latency
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <AuthToggle isLogin={isLogin} onToggle={setIsLogin} />
          <AuthForm isLogin={isLogin} onSubmit={handleSubmit} />
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Powered by Bun + WebSockets + Redis
        </p>
      </div>
    </div>
  )
}
