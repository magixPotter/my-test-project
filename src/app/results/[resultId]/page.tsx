'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic, Test } from '@/types'
import { getTopic, getTest } from '@/lib/db'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const resultId = params.resultId as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // TODO: Получить результат из Firebase по ID
    // Для теста используем localStorage
    const savedResult = localStorage.getItem(`result_${resultId}`)
    if (savedResult) {
      setResult(JSON.parse(savedResult))
    }
  }, [resultId])

  if (loading) return <LoadingSpinner />

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Результаты не найдены</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Статус */}
        <div className="text-center mb-8">
          {result.passed ? (
            <div>
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-4xl font-bold text-green-600 mb-2">
                Поздравляем!
              </h1>
              <p className="text-gray-600 text-lg">
                Ты прошёл уровень {result.testLevel}!
              </p>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4">😞</div>
              <h1 className="text-4xl font-bold text-red-600 mb-2">
                Не получилось
              </h1>
              <p className="text-gray-600 text-lg">
                Попробуй пройти тест ещё раз
              </p>
            </div>
          )}
        </div>

        {/* Результат */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <p className="text-gray-600 mb-2">Твой результат:</p>
            <p className="text-5xl font-bold text-blue-600">
              {result.score}/{result.totalQuestions}
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {result.percentage}%
            </p>
          </div>
        </div>

        {/* Требуемый процент */}
        <div className="text-center mb-8 p-4 bg-gray-100 rounded">
          <p className="text-gray-600">
            Требуемый результат: {60}%
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded font-semibold transition"
          >
            На главную
          </Link>

          {result.passed && (
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition"
            >
              Следующий уровень
            </button>
          )}

          {!result.passed && (
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </div>
  )
}