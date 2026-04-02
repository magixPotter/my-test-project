'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic, Test, StudentProgress } from '@/types'
import { useStudent } from '@/context/StudentContext'

export default function StudentTopicPage() {
  const params = useParams()
  const router = useRouter()
  const [topicId, setTopicId] = useState<string | null>(null)

  const [topic, setTopic] = useState<Topic | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { studentName } = useStudent()

  useEffect(() => {
  console.log('params:', params)
  console.log('params.topicid:', params?.topicid) 
  
  if (params && params.topicid) {
    console.log('Setting topicid to:', params.topicid)
    setTopicId(params.topicid as string)
  }
}, [params])

useEffect(() => {
  console.log('studentName from context:', studentName)
  
  if (!studentName) {  
    console.log('❌ No studentName in context, redirecting')
    router.push('/student')
  } else {
    if (topicId) {
      console.log('✅ Calling fetchData with topicId:', topicId, 'and name:', studentName)
      fetchData(studentName, topicId)  
    }
  }
}, [topicId, studentName, router])  

  const fetchData = async (name: string, topicId: string) => {
  try {
    setLoading(true)
    
    const url = `/api/student/topic/${topicId}?studentName=${encodeURIComponent(name)}`
    console.log('📡 Fetching from URL:', url)  // ← Добавьте это
    
    const response = await fetch(url)
    console.log('📡 Response status:', response.status)  // ← И это
    console.log('📡 Response ok:', response.ok)  // ← И это

    if (!response.ok) {
      const errorData = await response.json()
      setError(errorData.error || 'Ошибка при загрузке темы')
      return
    }

    const { topic, tests, progress } = await response.json()
    setTopic(topic)
    setTests(tests)
    setProgress(progress)
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
        <Link
          href="/student"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
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
        <Link
          href="/student"
          className="text-blue-600 hover:underline mb-8 inline-block font-semibold"
        >
          ← Вернуться к темам
        </Link>

        {/* Заголовок темы */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {topic.name}
          </h1>
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
          {['A', 'B', 'C'].map((level) => {
            const test = tests.find((t) => t.level === level)
            const levelProgress = progress?.levelProgress[level]
            const levelNames: { [key: string]: string } = {
              A: 'Базовый',
              B: 'Средний',
              C: 'Продвинутый',
            }
            const levelEmojis: { [key: string]: string } = {
              A: '🟢',
              B: '🟡',
              C: '🔴',
            }

            // Определить статус уровня
            const isLocked =
              level !== 'A' && progress?.levelProgress[level]?.status === 'locked'
            const isPassed = levelProgress?.status === 'passed'
            const isFailed = levelProgress?.status === 'failed'
            const hasAttempts =
              (levelProgress?.attempts || 0) < (test?.maxAttempts || 0)

            return (
              <div
                key={level}
                className={`bg-white rounded-lg shadow-md p-6 transition transform ${
                  isLocked ? 'opacity-60' : 'hover:shadow-lg'
                }`}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {levelEmojis[level]} Уровень {level} -{' '}
                  {levelNames[level]}
                </h2>

                {test ? (
                  <div className="space-y-4">
                    {/* Информация о тесте */}
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">
                        <strong>Вопросов:</strong> {test.questionsPerTest}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Попыток:</strong> {test.maxAttempts}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Проходной балл:</strong> {test.passingScore}%
                      </p>
                    </div>

                    {/* Статус */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      {isPassed && (
                        <p className="text-green-700 font-semibold">
                          ✅ Пройден! ({levelProgress?.bestScore}%)
                        </p>
                      )}
                      {isFailed && (
                        <p className="text-red-700 font-semibold">
                          ❌ Исчерпаны попытки
                        </p>
                      )}
                      {!isPassed &&
                        !isFailed &&
                        levelProgress &&
                        levelProgress.status !== 'locked' && (
                          <p className="text-blue-700 font-semibold">
                            📝 Попыток: {levelProgress.attempts}/{test.maxAttempts}
                          </p>
                        )}
                      {isLocked && (
                        <p className="text-gray-600 font-semibold">
                          🔒 Заблокирован (пройдите уровень A)
                        </p>
                      )}
                    </div>

                    {/* Кнопка */}
                    {isLocked ? (
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-gray-400 text-white rounded font-semibold cursor-not-allowed opacity-50"
                      >
                        🔒 Заблокирован
                      </button>
                    ) : isPassed ? (
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold cursor-not-allowed"
                      >
                        ✅ Пройден
                      </button>
                    ) : isFailed ? (
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-red-600 text-white rounded font-semibold cursor-not-allowed"
                      >
                        ❌ Попытки закончились
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          router.push(`/student/test/${test.id}`)
                        }
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-semibold transition"
                      >
                        Начать тест →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Тест на разработке
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}