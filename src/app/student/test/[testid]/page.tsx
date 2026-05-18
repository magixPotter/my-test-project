'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import TestQuestion from '@/components/TestQuestion'
import { Test, Question, StudentProgress, QuestionType } from '@/types'
import {
  getOrCreateStudentProgress,
  updateStudentProgress,
  saveTestResult,
} from '@/lib/db'
import { validateAnswer, validateMatchingPartial } from '@/lib/answerValidation'
import { getRandomItems } from '@/lib/utils'
import { useStudent } from '@/context/StudentContext'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const { studentName, isLoading: contextLoading } = useStudent()

  const [testId, setTestId] = useState<string | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{
    [key: string]: any
  }>({})
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (params && params.testid) {
      setTestId(params.testid as string)
    }
  }, [params])

  useEffect(() => {
    if (testId) {
      fetchTestData()
    }
  }, [testId])

  useEffect(() => {
    if (test && studentName && currentQuestions.length === 0) {
      loadProgress()
    }
  }, [test, studentName, currentQuestions.length])

  const fetchTestData = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/student/test/${testId}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Тестті жүктеу кезінде қате')
        return
      }

      const { test, questions } = await response.json()

      if (test.status === 'closed') {
        setError('Бұл тестті мұғалім аяқтады.')
        return
      }

      setTest(test)
      setAllQuestions(questions)

      if (questions.length === 0) {
        setError('Бұл тестте сұрақтар жоқ.')
      }
    } catch (err) {
      setError('Тестті жүктеу кезінде қате')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      setProgressLoading(true)
      if (!studentName || !test) return

      const progressData = await getOrCreateStudentProgress(studentName, test.topicId)
      setProgress(progressData)
    } catch (err) {
      console.error('Error loading progress:', err)
    } finally {
      setProgressLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!studentName || !studentName.trim()) {
      setError('Қате: студенттің аты табылмады')
      return
    }

    if (!test) return

    try {
      setLoading(true)

      const progressData = await getOrCreateStudentProgress(studentName, test.topicId)
      setProgress(progressData)

      const levelProgress = progressData.levelProgress[test.level]
      if ((levelProgress?.attempts || 0) >= test.maxAttempts) {
        setError('Сіз осы деңгейдегі барлық әрекеттерді аяқтадыңыз')
        return
      }

      const usedQuestionIds = levelProgress?.usedQuestions || []
      let availableQuestions = allQuestions.filter(
        (q) => !usedQuestionIds.includes(q.id)
      )

      if (availableQuestions.length < test.questionsPerTest) {
        const questionsToAdd = allQuestions.slice(
          0,
          test.questionsPerTest - availableQuestions.length
        )
        availableQuestions = [...availableQuestions, ...questionsToAdd]
      }

      const selectedQuestions = getRandomItems(
        availableQuestions,
        Math.min(test.questionsPerTest, availableQuestions.length)
      )

      setCurrentQuestions(selectedQuestions)
      setCurrentQuestionIndex(0)
      setAnswers({})
    } catch (err) {
      setError('Тестті бастау кезінде қате пайда болды')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (
    questionId: string,
    selectedAnswer: any
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitTest = async () => {
    if (!test || !progress || !studentName) return

    try {
      setSubmitting(true)

      // For matching: each correct pair counts as 1 point
      let totalPoints = 0
      let correctPoints = 0

      const testAnswers = currentQuestions.map((question) => {
        const userAnswer = answers[question.id]

        if (question.type === 'matching') {
          const { correct: matchCorrect, total: matchTotal } = validateMatchingPartial(question, userAnswer || {})
          totalPoints += matchTotal
          correctPoints += matchCorrect
          return {
            questionId: question.id,
            questionType: question.type,
            userAnswer: userAnswer || {},
            isCorrect: matchCorrect === matchTotal && matchTotal > 0,
            matchCorrect,
            matchTotal,
          }
        }

        const isCorrect = validateAnswer(question, userAnswer)
        totalPoints += 1
        correctPoints += isCorrect ? 1 : 0

        return {
          questionId: question.id,
          questionType: question.type,
          userAnswer: userAnswer || '',
          isCorrect,
        }
      })

      const correct = correctPoints
      const total = totalPoints
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

      const nextLevel = test.level === 'A' ? 'B' : test.level === 'B' ? 'C' : null
      const isPassed = percentage >= test.passingScore

      const resultId = await saveTestResult({
        studentName,
        topicId: test.topicId,
        testLevel: test.level,
        questionType: test.questionType || 'multipleChoice',
        attemptNumber:
          (progress.levelProgress[test.level]?.attempts || 0) + 1,
        selectedQuestions: currentQuestions.map((q) => q.id),
        answers: testAnswers,
        score: correct,
        totalQuestions: total,
        percentage,
        passed: isPassed,
        completedAt: new Date(),
        nextTestLevel: isPassed ? nextLevel : null,
      })

      const newLevelProgress = { ...progress.levelProgress }
      const currentLevelProgress = newLevelProgress[test.level] || {}
      const attempts = (currentLevelProgress.attempts || 0) + 1

      newLevelProgress[test.level] = {
        ...currentLevelProgress,
        attempts,
        usedQuestions: [
          ...(currentLevelProgress.usedQuestions || []),
          ...currentQuestions.map((q) => q.id),
        ],
        bestScore:
          percentage > (currentLevelProgress.bestScore || 0)
            ? percentage
            : currentLevelProgress.bestScore || null,
        status: isPassed
          ? 'passed'
          : attempts >= test.maxAttempts
            ? 'failed'
            : 'in_progress',
      }

      if (test.level === 'A' && isPassed) {
        newLevelProgress['B'] = {
          ...newLevelProgress['B'],
          status: 'in_progress',
        }
      } else if (test.level === 'B' && isPassed) {
        newLevelProgress['C'] = {
          ...newLevelProgress['C'],
          status: 'in_progress',
        }
      }

      await updateStudentProgress(progress.id, {
        levelProgress: newLevelProgress,
        currentLevel: isPassed
          ? test.level === 'A'
            ? 'B'
            : test.level === 'B'
              ? 'C'
              : 'C'
          : test.level,
      })

      router.push(`/student/results/${resultId}`)
    } catch (err) {
      setError('Нәтижелерді сақтау кезінде қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (contextLoading) return <LoadingSpinner />

  if (!studentName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-md w-full text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Кіруге тыйым салынады ❌
          </h2>
          <p className="text-gray-600 text-sm md:text-base mb-6">
            Алдымен өз атыңызды басты бетке енгізіңіз
          </p>
          <button
            onClick={() => router.push('/student')}
            className="w-full px-4 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-semibold transition text-sm md:text-base"
          >
            Басты бетке оралу
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <div className="text-center text-red-600">
          <p className="text-base md:text-lg font-semibold">
            {error || 'Тестті жүктеу кезінде қате'}
          </p>
        </div>
      </div>
    )
  }

  if (currentQuestions.length === 0) {
    if (progressLoading || !progress) {
      return <LoadingSpinner />
    }

    const levelProgress = progress?.levelProgress[test.level]
    const usedAttempts = levelProgress?.attempts || 0
    const maxAttempts = test.maxAttempts
    const remainingAttempts = maxAttempts - usedAttempts
    const canStartTest = remainingAttempts > 0

    const questionTypeInfo: Record<string, { label: string; icon: string; hint: string }> = {
      multipleChoice: { label: 'Бірнеше нұсқалы сұрақ', icon: '☑️', hint: 'Дұрыс жауапты немесе жауаптарды таңдаңыз' },
      freeText: { label: 'Ашық жауап', icon: '✍️', hint: 'Жауапты өз сөзіңізбен жазыңыз' },
      matching: { label: 'Сәйкестендіру', icon: '🔗', hint: 'Сол жақ пен оң жақ элементтерін сәйкестендіріңіз' },
      fillInTheBlank: { label: 'Пропускты толтыру', icon: '📝', hint: 'Пропущенное слово немесе фразаны жазыңыз' },
    }
    const qTypeKey = test.questionType || 'multipleChoice'
    const typeInfo = questionTypeInfo[qTypeKey] || questionTypeInfo['multipleChoice']

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full">
          {/* Заголовок */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">{typeInfo.icon}</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Тестке дайынсыз ба?
            </h2>
            <p className="text-sm text-gray-500 mt-1">{studentName}</p>
          </div>

          {/* Тип задания */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Тапсырма түрі</p>
            <p className="text-sm font-bold text-blue-900">{typeInfo.label}</p>
            <p className="text-xs text-blue-600 mt-1 italic">{typeInfo.hint}</p>
          </div>

          {/* Инструкция уровня, если есть */}
          {test.instruction && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">💡 Нұсқаулық</p>
              <p className="text-sm text-amber-900">{test.instruction}</p>
            </div>
          )}

          {/* Инфо о тесте */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Деңгей</p>
              <p className="text-lg font-bold text-blue-600">{test.level}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Сұрақтар</p>
              <p className="text-lg font-bold text-gray-800">{test.questionsPerTest}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Әрекеттер</p>
              <p className="text-lg font-bold text-gray-800">{usedAttempts}/{maxAttempts}</p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-xs text-green-700">Өту балы: <span className="font-bold">{test.passingScore}%</span></p>
          </div>

          {!canStartTest && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs md:text-sm text-center">
              ❌ Барлық әрекеттер аяқталды
            </div>
          )}

          {error && canStartTest && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs md:text-sm">
              {error}
            </div>
          )}

          {canStartTest ? (
            <button
              onClick={handleStartTest}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md"
            >
              {loading ? '⏳ Жүктелуде...' : '🚀 Тестті бастау'}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/student/topic/${test.topicId}`)}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition text-base"
            >
              ← Тақырыпқа оралу
            </button>
          )}
        </div>
      </div>
    )
  }

  const currentQuestion = currentQuestions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Прогресс */}
        <div className="mb-6 md:mb-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Сұрақ {currentQuestionIndex + 1} / {currentQuestions.length}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{studentName}</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <p className="text-xs md:text-sm font-semibold text-gray-700">
                Деңгей: <span className="text-blue-600">{test?.level}</span>
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-300 rounded-full h-2 md:h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 md:h-3 rounded-full transition-all"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / currentQuestions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Вопрос */}
        {currentQuestion && (
          <TestQuestion
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswerSelect={(selectedAnswer) =>
              handleAnswerSelect(currentQuestion.id, selectedAnswer)
            }
          />
        )}

        {/* Кнопки навигации */}
        <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-900 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            ← Артқа
          </button>

          {currentQuestionIndex === currentQuestions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded font-semibold transition disabled:opacity-50 text-sm md:text-base"
            >
              {submitting ? 'Жіберілуде...' : 'Тестті аяқтау ✅'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-semibold transition text-sm md:text-base"
            >
              Келесі →
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}