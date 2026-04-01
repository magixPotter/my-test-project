'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic, Test } from '@/types'
import { getTopic, getTestsByTopic } from '@/lib/db'

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.topicId as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [topicId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const topicData = await getTopic(topicId)
      const testsData = await getTestsByTopic(topicId)

      if (!topicData) {
        setError('Тема не найдена')
        return
      }

      setTopic(topicData)
      setTests(testsData)
    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error || 'Тема не найдена'}</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <Link
        href="/"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Вернуться
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-4">{topic.name}</h1>
      <p className="text-gray-600 mb-8">{topic.description}</p>

      {/* Ошибка */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Уровни тестов */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Выбери уровень сложности:
        </h2>

        {tests.length === 0 ? (
          <p className="text-gray-500">
            Для этой темы ещё нет доступных тестов
          </p>
        ) : (
          <div className="space-y-4">
            {['A', 'B', 'C'].map((level) => {
              const test = tests.find((t) => t.level === level)
              const isLocked = level === 'B' || level === 'C' // В будущем проверим прогресс
              const isActive = test?.status === 'active'

              return (
                <div
                  key={level}
                  className={`p-6 border-2 rounded-lg transition ${
                    isLocked
                      ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                      : isActive
                        ? 'border-blue-500 bg-blue-50 cursor-pointer hover:shadow-lg'
                        : 'border-red-300 bg-red-50 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Уровень {level}
                      </h3>
                      {test && (
                        <p className="text-sm text-gray-600 mt-1">
                          {test.questionsPerTest} вопросов из{' '}
                          {test.totalQuestions} (макс {test.maxAttempts} попыток)
                        </p>
                      )}
                      {isLocked && (
                        <p className="text-sm text-gray-600 mt-1">
                          🔒 Заблокирован (пройди предыдущий уровень)
                        </p>
                      )}
                      {!isActive && (
                        <p className="text-sm text-red-600 mt-1">
                          ❌ Тест закрыт преподавателем
                        </p>
                      )}
                    </div>

                    {test && isActive && !isLocked && (
                      <button
                        onClick={() => router.push(`/test/${test.id}`)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                      >
                        Начать →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}