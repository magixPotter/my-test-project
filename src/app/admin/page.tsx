'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAllResults } from '@/lib/db'
import { TestResult } from '@/types'

export default function AdminDashboard() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const data = await getAllResults()
      setResults(data)
    } catch (err) {
      console.error('Error fetching results:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalTests = results.length
  const passedTests = results.filter((r) => r.passed).length
  const averageScore =
    totalTests > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.percentage, 0) / totalTests
        )
      : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        ⚙️ Админ панель
      </h1>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Всего тестов */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">
            Всего тестов пройдено
          </h3>
          <p className="text-4xl font-bold text-blue-600">{totalTests}</p>
        </div>

        {/* Пройдено */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">
            Успешно пройдено
          </h3>
          <p className="text-4xl font-bold text-green-600">{passedTests}</p>
          <p className="text-sm text-gray-500 mt-1">
            {totalTests > 0
              ? `${Math.round((passedTests / totalTests) * 100)}% успеха`
              : 'N/A'}
          </p>
        </div>

        {/* Средний балл */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">
            Средний результат
          </h3>
          <p className="text-4xl font-bold text-purple-600">{averageScore}%</p>
        </div>
      </div>

      {/* Быстрые ссылки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Управление темами */}
        <Link
          href="/admin/topics"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            📚 Управление темами
          </h3>
          <p className="text-gray-600 text-sm">
            Добавляй, редактируй и удаляй темы, создавай вопросы
          </p>
        </Link>

        {/* Результаты */}
        <Link
          href="/admin/results"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            📊 Результаты тестов
          </h3>
          <p className="text-gray-600 text-sm">
            Просматривай результаты всех учеников
          </p>
        </Link>

        {/* Управление */}
        <Link
          href="/admin/control"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            🎛️ Управление доступом
          </h3>
          <p className="text-gray-600 text-sm">
            Открывай и закрывай доступ к тестам
          </p>
        </Link>
      </div>
    </div>
  )
}