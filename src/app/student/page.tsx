'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic } from '@/types'
import { getTopics } from '@/lib/db'

export default function StudentPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(true)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    const savedName = localStorage.getItem('studentName')
    if (savedName) {
      setStudentName(savedName)
      setShowNameDialog(false)
    }
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(false)
      const allTopics = await getTopics()
      // Показываем только открытые темы
      const activeTopics = allTopics.filter(t => t.status === 'active')
      setTopics(activeTopics)
    } catch (err) {
      setError('Ошибк�� при загрузке тем')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempName.trim()) {
      setError('Введи своё имя')
      return
    }
    localStorage.setItem('studentName', tempName)
    setStudentName(tempName)
    setShowNameDialog(false)
    setError('')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Диалог ввода имени */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Введи своё имя
            </h2>

            <form onSubmit={handleSetName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя ученика *
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Например: Иван Петров"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
              >
                Начать
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              📚 Выбери тему для тестирования
            </h1>
            {studentName && (
              <p className="text-gray-600 mt-2">
                Привет, <span className="font-semibold">{studentName}</span>! 👋
              </p>
            )}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('studentName')
              setShowNameDialog(true)
              setTempName('')
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
          >
            Выход
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Список тем */}
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              Временно нет доступных тем для тестирования 😔
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/student/topics/${topic.id}`}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105"
              >
                // Картинка
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      {topic.imageUrl ? (
                          <img
                           src={topic.imageUrl}
                           alt={topic.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                        ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl">
                         📚
                      </div>
                       )}
                    </div>

                {/* Содержимое */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                    {topic.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {topic.description}
                  </p>

                  {/* Кнопка */}
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-semibold transition">
                    Начать тест →
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}