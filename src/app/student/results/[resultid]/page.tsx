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
  const [resultId, setResultId] = useState<string | null>(null)

  const [result, setResult] = useState<TestResult | null>(null)
  const [questions, setQuestions] = useState<{ [key: string]: Question }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  )

  // Первый useEffect: получить resultId
  useEffect(() => {
    if (params && params.resultid) {
      setResultId(params.resultid as string)
    }
  }, [params])

  // Второй useEffect: загружать результат когда resultId готов
  useEffect(() => {
    if (resultId) {
      fetchResult()
    }
  }, [resultId])

  const fetchResult = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/student/results/${resultId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Нәтижелерді жүктеу кезінде қате пайда болды')
        return
      }

      const { result: testResult } = await response.json()
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
      setError('Нәтижелерді жүктеу кезінде қате пайда болды')
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
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <div className="text-center text-red-600">
          <p className="text-base md:text-lg font-semibold">{error || 'Қате'}</p>
        </div>
      </div>
    )
  }

  const passed = result.passed

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Итоговая карточка */}
        <div
          className={`rounded-lg shadow-lg p-6 md:p-8 mb-6 md:mb-8 ${
            passed
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-red-400 to-red-500'
          }`}
        >
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 break-words">
              {passed ? '🎉 Құттықтаймыз!' : '😢 Өткізілмеген'}
            </h1>
            <p className="text-base md:text-xl mb-6">
              {passed
                ? 'Сіз бұл деңгейді сәтті аяқтадыңыз.!'
                : 'Қайтадан байқап көріңіз.'}
            </p>

            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white bg-opacity-30 rounded p-3 md:p-4">
                <p className="text-xs md:text-sm opacity-80 text-black font-medium">Дұрыс</p>
                <p className="text-2xl md:text-3xl font-bold text-black">{result.score}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded p-3 md:p-4">
                <p className="text-xs md:text-sm opacity-80 text-black font-medium">Барлығы</p>
                <p className="text-2xl md:text-3xl font-bold text-black">{result.totalQuestions}</p>
              </div>
              <div className="bg-white bg-opacity-30 rounded p-3 md:p-4">
                <p className="text-xs md:text-sm opacity-80 text-black font-medium">Пайыз</p>
                <p className="text-2xl md:text-3xl font-bold text-black">{result.percentage}%</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <Link
                href={`/student/topic/${result.topicId}`}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-white text-gray-900 rounded font-semibold hover:bg-gray-100 active:bg-gray-200 transition text-center text-sm md:text-base"
              >
                ← Тақырыпқа оралу
              </Link>
              {!passed && (
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-white bg-opacity-20 border-2 border-white text-white rounded font-semibold hover:bg-opacity-30 active:bg-opacity-40 transition text-sm md:text-base"
                >
                  Қайтадан өту
                </button>
              )}
              {passed && result.nextTestLevel && (
                <button
                  onClick={() => router.push(`/student/topic/${result.topicId}?nextLevel=${result.nextTestLevel}`)}
                  className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-white text-gray-900 rounded font-semibold hover:bg-gray-100 active:bg-gray-200 transition text-sm md:text-base"
                >
                  Деңгей {result.nextTestLevel} →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Подробные ответы */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            Толық талдау
          </h2>

          <div className="space-y-3 md:space-y-4">
            {result.answers.map((answer, idx) => {
              const question = questions[answer.questionId]
              const isExpanded = expandedQuestions.has(answer.questionId)

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 md:p-4 cursor-pointer transition ${
                    answer.isCorrect
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-red-300 bg-red-50 hover:bg-red-100'
                  }`}
                  onClick={() => toggleQuestion(answer.questionId)}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="text-xl md:text-2xl flex-shrink-0 mt-1">
                      {answer.isCorrect ? '✅' : '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm md:text-base break-words">
                        Сұрақ {idx + 1}: {question?.text || 'Жүктелуде...'}
                      </p>

                      {isExpanded && question && (
                        <div className="mt-4 space-y-3 pt-4 border-t border-gray-300">
                          {/* Ваш ответ */}
                          <div>
                            <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">
                              Сіздің жауабыңыз:
                            </p>
                            <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                              {answer.selectedOptions.length > 0 ? (
                                answer.selectedOptions.map((optId) => {
                                  const option = question.options.find(
                                    (o) => o.id === optId
                                  )
                                  return (
                                    <li key={optId} className="break-words">
                                      • {option?.text || 'Неизвестный ответ'}
                                    </li>
                                  )
                                })
                              ) : (
                                <li className="italic text-gray-500">Ответ не выбран</li>
                              )}
                            </ul>
                          </div>

                          {/* Правильный ответ (если неправильно) */}
                          {!answer.isCorrect && (
                            <div>
                              <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">
                                Дұрыс жауап:
                              </p>
                              <ul className="text-xs md:text-sm text-green-700 space-y-1">
                                {question.options
                                  .filter((o) => o.isCorrect)
                                  .map((option) => (
                                    <li key={option.id} className="break-words">
                                      • {option.text}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Объяснение */}
                          {question.explanation && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                              <p className="text-xs md:text-sm font-semibold text-blue-900 mb-1">
                                💡 Түсіндірме:
                              </p>
                              <p className="text-xs md:text-sm text-blue-800 break-words">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Подсказка для разворачивания */}
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 mt-2">
                          {isExpanded ? '▼ Жасыру' : '▶ Толығырақ'}
                        </p>
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