'use client'

import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          📚 Physics Tests
        </Link>

        <div className="flex gap-4">
          <Link
            href="/"
            className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
          >
            Басты бет
          </Link>
          <Link
            href="/admin/login"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
          >
            Админ панелі
          </Link>
        </div>
      </div>
    </nav>
  )
}