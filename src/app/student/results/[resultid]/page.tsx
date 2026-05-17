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
        <div className={`rounded-2xl shadow-xl p-6 md:p-8 mb-6 md:mb-8 text-white ${
          passed
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          {/* Emoji + Заголовок */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {passed ? 'Құттықтаймыз!' : 'Өтпеді'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {passed ? 'Сіз бұл деңгейді сәтті аяқтадыңыз!' : 'Қайтадан байқап көріңіз.'}
            </p>
          </div>

          {/* Прогресс-бар */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Нәтиже</span>
              <span>{result.percentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-white/70 mb-1">Дұрыс</p>
              <p className="text-2xl md:text-3xl font-bold">{result.score}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-white/70 mb-1">Барлығы</p>
              <p className="text-2xl md:text-3xl font-bold">{result.totalQuestions}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-white/70 mb-1">Пайыз</p>
              <p className="text-2xl md:text-3xl font-bold">{result.percentage}%</p>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col md:flex-row gap-3">
            <Link
              href={`/student/topic/${result.topicId}`}
              className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition text-center text-sm md:text-base shadow"
            >
              ← Тақырыпқа оралу
            </Link>
            {!passed && (
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-white/20 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/30 transition text-sm md:text-base"
              >
                🔄 Қайтадан өту
              </button>
            )}
            {passed && result.nextTestLevel && (
              <button
                onClick={() => router.push(`/student/topic/${result.topicId}?nextLevel=${result.nextTestLevel}`)}
                className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition text-sm md:text-base shadow"
              >
                Деңгей {result.nextTestLevel} →
              </button>
            )}
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
              const isMatching = answer.questionType === 'matching'
              const matchCorrect = (answer as any).matchCorrect
              const matchTotal = (answer as any).matchTotal

              // For matching: show partial score
              const matchLabel = isMatching && matchTotal
                ? `${matchCorrect}/${matchTotal} жұп дұрыс`
                : null

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-3 md:p-4 cursor-pointer transition ${
                    answer.isCorrect
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : isMatching && matchCorrect > 0
                      ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                      : 'border-red-300 bg-red-50 hover:bg-red-100'
                  }`}
                  onClick={() => toggleQuestion(answer.questionId)}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="text-xl md:text-2xl flex-shrink-0 mt-0.5">
                      {answer.isCorrect ? '✅' : isMatching && matchCorrect > 0 ? '🟡' : '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm md:text-base break-words flex-1">
                          {idx + 1}. {question?.text || 'Жүктелуде...'}
                        </p>
                        {/* Тип задания badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          answer.questionType === 'multipleChoice' ? 'bg-blue-100 text-blue-700' :
                          answer.questionType === 'freeText' ? 'bg-green-100 text-green-700' :
                          answer.questionType === 'matching' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {answer.questionType === 'multipleChoice' ? '☑ Тест' :
                           answer.questionType === 'freeText' ? '✍ Ашық' :
                           answer.questionType === 'matching' ? '🔗 Сәйкес' :
                           '📝 Пропуск'}
                        </span>
                      </div>

                      {/* Для matching: показать счёт сразу */}
                      {matchLabel && (
                        <p className={`text-xs font-semibold mt-1 ${answer.isCorrect ? 'text-green-600' : matchCorrect > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {matchLabel}
                        </p>
                      )}

                      {isExpanded && question && (
                        <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">

                          {/* TYPE 1: Multiple Choice */}
                          {answer.questionType === 'multipleChoice' && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Барлық жауаптар:</p>
                              {(question.options as any[]).map((option: any) => {
                                const userSelected = Array.isArray(answer.userAnswer) && answer.userAnswer.includes(option.id)
                                const isCorrect = option.isCorrect
                                return (
                                  <div key={option.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs md:text-sm ${
                                    isCorrect && userSelected ? 'bg-green-100 border border-green-300' :
                                    isCorrect ? 'bg-green-50 border border-green-200' :
                                    userSelected ? 'bg-red-100 border border-red-300' :
                                    'bg-gray-50 border border-gray-200'
                                  }`}>
                                    <span>{isCorrect && userSelected ? '✅' : isCorrect ? '✔' : userSelected ? '❌' : '○'}</span>
                                    <span className={`break-words ${isCorrect ? 'font-semibold' : ''}`}>{option.text}</span>
                                    {userSelected && !isCorrect && <span className="ml-auto text-red-500 text-xs">сіздің жауабыңыз</span>}
                                    {isCorrect && !userSelected && <span className="ml-auto text-green-600 text-xs">дұрыс жауап</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* TYPE 2: Free Text */}
                          {answer.questionType === 'freeText' && (
                            <div className="space-y-2">
                              <div className={`p-2 rounded-lg border text-xs md:text-sm ${answer.isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                                <p className="font-semibold text-gray-700 mb-1">Сіздің жауабыңыз:</p>
                                <p className="break-words">{String(answer.userAnswer) || '—'}</p>
                              </div>
                              {!answer.isCorrect && (
                                <div className="p-2 bg-green-50 border border-green-300 rounded-lg text-xs md:text-sm">
                                  <p className="font-semibold text-green-700 mb-1">✔ Дұрыс вариациялар:</p>
                                  {((question.options as any[])[0]?.variations || []).map((v: string, vi: number) => (
                                    <p key={vi} className="text-green-700">• {v}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TYPE 3: Matching */}
                          {answer.questionType === 'matching' && (() => {
                            const allPairs = (question.options as any[])[0]?.pairs || []
                            const userMatches: Record<string, string> = typeof answer.userAnswer === 'object' && !Array.isArray(answer.userAnswer)
                              ? answer.userAnswer as Record<string, string>
                              : {}

                            return (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Жұптар нәтижесі:</p>
                                {allPairs.slice(0, (question.options as any[])[0]?.displayPairCount || allPairs.length).map((pair: any) => {
                                  const userRightId = userMatches[pair.left.id]
                                  const isCorrectPair = userRightId === pair.right.id
                                  const userRightPair = allPairs.find((p: any) => p.right.id === userRightId)
                                  return (
                                    <div key={pair.id} className={`p-2 rounded-lg border text-xs md:text-sm ${isCorrectPair ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                                      <div className="flex items-center gap-2">
                                        <span>{isCorrectPair ? '✅' : '❌'}</span>
                                        <span className="font-medium flex-1 break-words">
                                          {pair.left.type === 'text' ? pair.left.content : '[Сурет]'}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className={`flex-1 break-words text-right ${isCorrectPair ? 'text-green-700 font-semibold' : 'text-red-600'}`}>
                                          {userRightPair ? (userRightPair.right.type === 'text' ? userRightPair.right.content : '[Сурет]') : '—'}
                                        </span>
                                      </div>
                                      {!isCorrectPair && (
                                        <p className="text-green-600 text-xs mt-1 pl-6">
                                          ✔ Дұрыс: {pair.right.type === 'text' ? pair.right.content : '[Сурет]'}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {/* TYPE 4: Fill in the Blank */}
                          {answer.questionType === 'fillInTheBlank' && (() => {
                            const fullText = (question.options as any[])[0]?.fullText || ''
                            const variations = (question.options as any[])[0]?.variations || []
                            const parts = fullText.split('___')
                            return (
                              <div className="space-y-2">
                                <div className={`p-3 rounded-lg border text-sm ${answer.isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                  <p className="text-gray-700">
                                    {parts[0]}
                                    <span className={`inline-block mx-1 px-3 py-0.5 rounded font-bold border-b-2 ${answer.isCorrect ? 'border-green-500 text-green-700 bg-green-100' : 'border-red-500 text-red-700 bg-red-100'}`}>
                                      {String(answer.userAnswer) || '—'}
                                    </span>
                                    {parts[1]}
                                  </p>
                                </div>
                                {!answer.isCorrect && (
                                  <div className="p-2 bg-green-50 border border-green-300 rounded-lg text-xs md:text-sm">
                                    <p className="font-semibold text-green-700 mb-1">✔ Дұрыс вариациялар:</p>
                                    {variations.map((v: string, vi: number) => (
                                      <p key={vi} className="text-green-700">• {v}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {/* Объяснение */}
                          {question.explanation && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
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

                      <p className="text-xs text-gray-400 mt-2">
                        {isExpanded ? '▲ Жасыру' : '▶ Толығырақ көру'}
                      </p>
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