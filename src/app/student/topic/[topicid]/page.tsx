'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic, Test } from '@/types'
import { getTopic, getTestsByTopic } from '@/lib/db'

export default function StudentTopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.topicId as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('studentName')
    if (!name) {
      router.push('/student')
    } else {
      setStudentName(name)
    }
    fetchData()
  }, [topicId, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const topicData = await getTopic(topicId)

      if (!topicData || topicData.status === 'closed') {
        setError('Эта тема закрыта для тестирования')
        return
      }

      setTopic(topicData)

      const testsData = await getTestsByTopic(topicId)
      const activeTests = testsData.filter(t => t.status === 'active')
      setTests(activeTests)
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
        <Link href="/student" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Вернуться к темам
        </Link>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error || 'Тема не найдена'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/student" className="text-blue-600 hover:underline mb-8 inline-block font-semibold">
          ← Вернуться к темам
        </Link>

        {/* Заголовок темы */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{topic.name}</h1>
          <p className="text-gray-600 text-lg mb-6">{topic.description}</p>
          {topic.imageUrl && (
            <div className="w-full max-w-md rounded overflow-hidden">
              <img
                src={topic.imageUrl}
                alt={topic.name}
                className="w-full h-auto"
              />
            </div>
          )}
        </div>

        {/* Уровни тестов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['A', 'B', 'C'].map((level, idx) => {
            const test = tests.find(t => t.level === level)
            const levelNames = {
              'A': 'Базовый',
              'B': 'Средний',
              'C': 'Продвинутый'
            }
            const levelEmojis = { 'A': '🟢', 'B': '🟡', 'C': '🔴' }

            return (
              <div key={level} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {levelEmojis[level as keyof typeof levelEmojis]} Уровень {level} - {levelNames[level as keyof typeof levelNames]}
                </h2>

                {test ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">
                        <strong>Вопросов в тесте:</strong> {test.questionsPerTest}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Попыток:</strong> {test.maxAttempts}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Проходной балл:</strong> {test.passingScore}%
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/student/test/${test.id}`)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-semibold transition"
                    >
                      Начать тест
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Тест на разработке</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}