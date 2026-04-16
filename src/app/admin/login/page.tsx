'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Құпия сөзді енгізіңіз')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Құпия сөз дұрыс емес')
        return
      }

      // Сохранить токен в localStorage
      localStorage.setItem('adminToken', data.token)

      // Перенаправить в админ панель
      router.push('/admin')
    } catch (err) {
      setError('Жүйеге кіру кезінде қате пайда болды')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full">
        {/* Заголовок */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Админ панель</h1>
        <p className="text-gray-600 text-sm md:text-base mb-6 md:mb-8">Кіру үшін құпия сөзді енгізіңіз</p>

        {/* Форма */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Құпия сөз
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm md:text-base"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs md:text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm md:text-base"
          >
            {loading ? 'Кіру...' : 'Кіру'}
          </button>
        </form>

        {/* Ссылка на главную */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-xs md:text-sm font-medium">
            ← Басты бетке оралу
          </Link>
        </div>
      </div>
    </div>
  )
}