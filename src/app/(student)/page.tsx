'use client'

import { useEffect, useState } from 'react'
import TopicCard from '@/components/TopicCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic } from '@/types'
import { getTopics } from '@/lib/db'

export default function StudentHome() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTopics()
  }, [])

 const fetchTopics = async () => {
  try {
    setLoading(true)
    const response = await fetch('/api/topics')
    const data = await response.json()
    setTopics(data.topics || [])
  } catch (err) {
    setError('Ошибка при загрузке тем')
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Тесты по физике
        </h1>
        <p className="text-gray-600">
          Выбери тему и начни прохождение тестов. Удачи! 🚀
        </p>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Список тем */}
      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Темы не найдены</p>
          <p className="text-sm">Преподаватель ещё не добавил ни одной темы</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}