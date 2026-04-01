'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TestResult, Question } from '@/types'
import { getQuestion } from '@/lib/db'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const resultId = params.resultid as string

  const [result, setResult] = useState<TestResult | null>(null)
  const [questions, setQuestions] = useState<{ [key: string]: Question }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  )

  useEffect(() => {
    fetchResult()
  }, [resultId])

  const fetchResult = async () => {
    try {
      setLoading(true)

      // Получить результат из localStorage или другого источника
      // Для этого нужно будет добавить API endpoint
      const storedResults = JSON.parse(localStorage.getItem('testResults') || '{}')
      const testResult = storedResults[resultId]

      if (!testResult) {
        setError('Результат не найден')
        return
      }

      setResult(testResult)

      // Загрузить все вопросы
      const questionsMap: { [key: string]: Question } = {}
      for (const answer of testResult.answers) {
        const question = await getQuestion(answer.questionId)
        if (question) {
          questionsMap[question.id] = question
        }
      }
      setQuestions(questionsMap)
    } catch (err) {
      setError('Ошибка при загрузке результатов')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  if (loading) return <LoadingSpinner />

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error || 'Ошибка'}</p>
        </div>
      </div>
    )
  }

  const passed = result.percentage >= 70 // Примерно из passingScore

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Итоговая карточка */}
        <div
          className={`rounded-lg shadow-lg p-8 mb-8 ${
            passed
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-red-400 to-red-500'
          }`}
        >
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">
              {passed ? '🎉 Поздравляем!' : '😢 Не пройдено'}
            </h1>
            <p className="text-xl mb-6">
              {passed
                ? 'Вы успешно прошли этот уровень!'
                : 'Попробуйте ещё раз.'}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white bg-opacity-20 rounded p-4">
                <p className="text-sm opacity-80">Правильных ответов</p>
                <p className="text-3xl font-bold">{result.score}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded p-4">
                <p className="text-sm opacity-80">Всего вопросов</p>
                <p className="text-3xl font-bold">{result.totalQuestions}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded p-4">
                <p className="text-sm opacity-80">Процент</p>
                <p className="text-3xl font-bold">{result.percentage}%</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/student/topic/${result.topicId}`}
                className="flex-1 px-6 py-3 bg-white text-gray-900 rounded font-semibold hover:bg-gray-100 transition text-center"
              >
                Вернуться к темам
              </Link>
              {!passed && (
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-white bg-opacity-20 border-2 border-white text-white rounded font-semibold hover:bg-opacity-30 transition"
                >
                  Попробовать снова
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Подробные ответы */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Подробный разбор
          </h2>

          <div className="space-y-4">
            {result.answers.map((answer, idx) => {
              const question = questions[answer.questionId]
              const isExpanded = expandedQuestions.has(answer.questionId)

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    answer.isCorrect
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                  onClick={() => toggleQuestion(answer.questionId)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1">
                      {answer.isCorrect ? '✅' : '❌'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        Вопрос {idx + 1}: {question?.text || 'Загрузка...'}
                      </p>

                      {isExpanded && question && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Ваш ответ:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {answer.selectedOptions.map((optId) => {
                                const option = question.options.find(
                                  (o) => o.id === optId
                                )
                                return (
                                  <li key={optId}>
                                    • {option?.text || 'Неизвестный ответ'}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>

                          {!answer.isCorrect && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Правильный ответ:
                              </p>
                              <ul className="text-sm text-green-700 space-y-1">
                                {question.options
                                  .filter((o) => o.isCorrect)
                                  .map((option) => (
                                    <li key={option.id}>
                                      • {option.text}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                💡 Объяснение:
                              </p>
                              <p className="text-sm text-blue-800">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}