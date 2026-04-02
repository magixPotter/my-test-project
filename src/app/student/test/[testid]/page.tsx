'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import TestQuestion from '@/components/TestQuestion'
import { Test, Question, StudentProgress } from '@/types'
import {
  getOrCreateStudentProgress,
  updateStudentProgress,
  saveTestResult,
} from '@/lib/db'
import { getRandomItems, calculateScore } from '@/lib/utils'
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
    [key: string]: string[]
  }>({})
  const [progress, setProgress] = useState<StudentProgress | null>(null)

  // Первый effect: получить testId из params
  useEffect(() => {
    if (params && params.testid) {
      console.log('Setting testId to:', params.testid)
      setTestId(params.testid as string)
    }
  }, [params])

  // Второй effect: загружать тест когда testId готов
  useEffect(() => {
    if (testId) {
      console.log('Fetching test with testId:', testId)
      fetchTestData()
    }
  }, [testId])

  const fetchTestData = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/student/test/${testId}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Ошибка при загрузке теста')
        return
      }

      const { test, questions } = await response.json()

      if (test.status === 'closed') {
        setError('Этот тест закрыт преподавателем')
        return
      }

      setTest(test)
      setAllQuestions(questions)

      if (questions.length === 0) {
        setError('Нет вопросов в этом тесте')
      }
    } catch (err) {
      setError('Ошибка при загрузке теста')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!studentName || !studentName.trim()) {
      setError('Ошибка: имя студента не найдено')
      return
    }

    if (!test) return

    try {
      setLoading(true)

      // Получить или создать прогресс ученика
      const progressData = await getOrCreateStudentProgress(studentName, test.topicId)
      setProgress(progressData)

      // Проверить - есть ли ещё попытки
      const levelProgress = progressData.levelProgress[test.level]
      if ((levelProgress?.attempts || 0) >= test.maxAttempts) {
        setError('Вы исчерпали все попытки на этом уровне')
        return
      }

      // Выбрать рандомные вопросы (исключая уже использованные)
      const usedQuestionIds = levelProgress?.usedQuestions || []
      let availableQuestions = allQuestions.filter(
        (q) => !usedQuestionIds.includes(q.id)
      )

      // Если недостаточно оставшихся вопросов, добавить уже использованные
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
      setError('Ошибка при запуске теста')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (
    questionId: string,
    selectedOptionIds: string[]
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOptionIds,
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

      // Проверить ответы
      const testAnswers = currentQuestions.map((question) => {
        const selectedOptions = answers[question.id] || []
        const correctOptions = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id)

        const isCorrect =
          selectedOptions.length > 0 &&
          selectedOptions.length === correctOptions.length &&
          selectedOptions.every((opt) => correctOptions.includes(opt))

        return {
          questionId: question.id,
          selectedOptions,
          isCorrect,
        }
      })

      const { correct, total, percentage } = calculateScore(testAnswers)

      // Сохранить результат
      const resultId = await saveTestResult({
        studentName,
        topicId: test.topicId,
        testLevel: test.level,
        attemptNumber:
          (progress.levelProgress[test.level]?.attempts || 0) + 1,
        selectedQuestions: currentQuestions.map((q) => q.id),
        answers: testAnswers,
        score: correct,
        totalQuestions: total,
        percentage,
        passed: percentage >= test.passingScore,
        completedAt: new Date(),
      })

      // Обновить прогресс ученика
      const newLevelProgress = { ...progress.levelProgress }
      const currentLevelProgress = newLevelProgress[test.level] || {}
      const attempts = (currentLevelProgress.attempts || 0) + 1
      const isPassed = percentage >= test.passingScore

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

      // Если прошел - разблокировать следующий уровень
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

      // Перейти на страницу результатов
      router.push(`/student/results/${resultId}`)
    } catch (err) {
      setError('Ошибка при сохранении результатов')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Если контекст ещё загружается
  if (contextLoading) return <LoadingSpinner />

  // Если нет имени студента - редирект на страницу входа
  if (!studentName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Доступ запрещен ❌
          </h2>
          <p className="text-gray-600 mb-6">
            Пожалуйста, сначала введи свое имя на главной странице
          </p>
          <button
            onClick={() => router.push('/student')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">
            {error || 'Ошибка при загрузке теста'}
          </p>
        </div>
      </div>
    )
  }

  // Начало теста (нужно нажать кнопку)
  if (currentQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Готов к тесту? 📝
          </h2>
          <p className="text-gray-600 mb-2">Уровень: <span className="font-semibold text-blue-600">{test.level}</span></p>
          <p className="text-gray-600 mb-6">
            Вопросов: {test.questionsPerTest} | Попыток: {test.maxAttempts}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStartTest}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Начать тест ✅'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Прогресс */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Вопрос {currentQuestionIndex + 1} из {currentQuestions.length}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{studentName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">
                Уровень: <span className="text-blue-600">{test?.level}</span>
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-300 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / currentQuestions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Вопрос */}
        {currentQuestions[currentQuestionIndex] && (
          <TestQuestion
            question={currentQuestions[currentQuestionIndex]}
            selectedOptionIds={
              answers[currentQuestions[currentQuestionIndex].id] || []
            }
            onAnswerSelect={(selectedIds) =>
              handleAnswerSelect(
                currentQuestions[currentQuestionIndex].id,
                selectedIds
              )
            }
          />
        )}

        {/* Кнопки навигации */}
        <div className="mt-8 flex gap-4 justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>

          {currentQuestionIndex === currentQuestions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Завершить тест ✅'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
            >
              Далее →
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}