'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4 md:p-8">
      <div className="text-center w-full max-w-md">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 md:mb-8 break-words">
          📚 Система тестирования
        </h1>
        
        <div className="space-y-3 md:space-y-4">
          <Link
            href="/student"
            className="inline-block w-full px-6 md:px-8 py-3 md:py-4 bg-white text-blue-600 rounded-lg font-bold text-base md:text-lg hover:bg-gray-100 active:bg-gray-200 transition shadow-lg"
          >
            👨‍🎓 Я Ученик
          </Link>
          
          <div className="py-2 md:py-3">
            <p className="text-white text-base md:text-lg font-medium">или</p>
          </div>
          
          <Link
            href="/admin/login"
            className="inline-block w-full px-6 md:px-8 py-3 md:py-4 bg-yellow-400 text-gray-900 rounded-lg font-bold text-base md:text-lg hover:bg-yellow-300 active:bg-yellow-500 transition shadow-lg"
          >
            👨‍💼 Я Администратор
          </Link>
        </div>

        <p className="text-white mt-8 md:mt-12 text-xs md:text-sm opacity-80 px-2">
          Выбери свою роль для входа в систему
        </p>
      </div>
    </div>
  )
}