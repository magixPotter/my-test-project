'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TestResult, Test } from '@/types'
import { getTest } from '@/lib/db'
import { useStudent } from '@/context/StudentContext'

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const resultId = params.resultid as string
  const { studentName, isLoading: contextLoading } = useStudent()

  const [result, setResult] = useState<TestResult | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentName && !contextLoading) {
      router.push('/student')
      return
    }

    fetchResult()
  }, [resultId, studentName, contextLoading, router])

  const fetchResult = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/student/results/${resultId}`)

      if (!response.ok) {
        setError('Результат не найден')
        return
      }

      const data = await response.json()
      setResult(data.result)

      // Загрузить информацию о тесте
      const testData = await getTest(data.result.testLevel)
      setTest(testData)
    } catch (err) {
      setError('Ошибка при загрузке результата')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (contextLoading || loading) return <LoadingSpinner />

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-md w-full text-center">
          <p className="text-base md:text-lg font-semibold text-red-600 mb-6">
            {error}
          </p>
          <Link
            href="/student"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition text-sm md:text-base"
          >
            ← Вернуться к темам
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(result.completedAt).toLocaleString('ru-RU')
  const isPassed = result.passed

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6 md:mb-8 text-center">
          <div className="text-5xl md:text-6xl mb-4">
            {isPassed ? '🎉' : '📚'}
          </div>
          <h1 className={`text-2xl md:text-4xl font-bold mb-2 break-words ${
            isPassed ? 'text-green-600' : 'text-blue-600'
          }`}>
            {isPassed ? 'Поздравляем!' : 'Результат теста'}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {isPassed
              ? 'Вы успешно прошли этот уровень!'
              : 'Спасибо за прохождение теста'}
          </p>
        </div>

        {/* Основная информация */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Студент */}
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                Ученик
              </p>
              <p className="text-lg md:text-xl font-bold text-gray-900 break-words">
                {result.studentName}
              </p>
            </div>

            {/* Уровень */}
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                Уровень теста
              </p>
              <p className="text-lg md:text-xl font-bold text-blue-600">
                {result.testLevel}
              </p>
            </div>

            {/* Попытка */}
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                Попытка
              </p>
              <p className="text-lg md:text-xl font-bold text-gray-900">
                {result.attemptNumber}
              </p>
            </div>

            {/* Да��а */}
            <div>
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                Дата прохождения
              </p>
              <p className="text-sm md:text-base font-bold text-gray-900 break-words">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Результат */}
          <div className={`p-4 md:p-6 rounded-lg border-2 ${
            isPassed
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="text-center">
              <p className={`text-xs md:text-sm font-semibold mb-2 ${
                isPassed ? 'text-green-700' : 'text-red-700'
              }`}>
                {isPassed ? '✅ ПРОЙДЕН' : '❌ НЕ ПРОЙДЕН'}
              </p>
              <div className="text-3xl md:text-5xl font-bold mb-2">
                <span className={isPassed ? 'text-green-600' : 'text-red-600'}>
                  {result.percentage}%
                </span>
              </div>
              <p className={`text-sm md:text-base font-semibold ${
                isPassed ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.score} из {result.totalQuestions} правильных
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <Link
              href={`/student/topic/${result.topicId}`}
              className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-semibold transition text-center text-sm md:text-base"
            >
              ← Вернуться к теме
            </Link>

            {isPassed && result.nextTestLevel && (
              <button
                onClick={() => {
                  const nextTestId = result.nextTestLevel
                  // Перейти на страницу следующего теста
                  router.push(`/student/test/${nextTestId}`)
                }}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded font-semibold transition text-center text-sm md:text-base"
              >
                Следующий уровень →
              </button>
            )}

            <Link
              href="/student"
              className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded font-semibold transition text-center text-sm md:text-base"
            >
              На главную
            </Link>
          </div>
        </div>

        {/* Детали ответов */}
        {result.answers && result.answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Детали ответов
            </h2>

            <div className="space-y-4">
              {result.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-l-4 rounded ${
                    answer.isCorrect
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">
                      {answer.isCorrect ? '✅' : '❌'}
                    </span>
                    <p className="flex-1 font-semibold text-gray-900 text-sm md:text-base">
                      Вопрос {idx + 1}
                    </p>
                  </div>
                  <p className={`text-xs md:text-sm font-medium ${
                    answer.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {answer.isCorrect ? 'Правильно' : 'Неправильно'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}