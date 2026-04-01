'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-8">
          📚 Система тестирования
        </h1>
        
        <div className="space-y-4">
          <Link
            href="/student"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            👨‍🎓 Я Ученик
          </Link>
          
          <div className="mx-4">
            <p className="text-white text-xl">или</p>
          </div>
          
          <Link
            href="/admin/login"
            className="inline-block px-8 py-4 bg-yellow-400 text-gray-900 rounded-lg font-bold text-lg hover:bg-yellow-300 transition shadow-lg"
          >
            👨‍💼 Я Администратор
          </Link>
        </div>

        <p className="text-white mt-12 text-sm opacity-80">
          Выбери свою роль для входа в систему
        </p>
      </div>
    </div>
  )
}