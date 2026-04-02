'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminNav() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    setIsAdmin(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  if (!isAdmin) return null

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <Link href="/admin" className="text-2xl font-bold">
            ⚙️ Админ панель
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Выход
          </button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Главная
          </Link>
          <Link
            href="/admin/topics"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Темы
          </Link>
          <Link
            href="/admin/results"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Результаты
          </Link>
        </div>
      </div>
    </nav>
  )
}