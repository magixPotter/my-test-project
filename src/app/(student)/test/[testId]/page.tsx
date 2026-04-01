'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import TestQuestion from '@/components/TestQuestion'
import { Test, Question, StudentProgress } from '@/types'
import {
  getTest,
  getQuestionsByTest,
  getOrCreateStudentProgress,
  updateStudentProgress,
  saveTestResult,
} from '@/lib/db'
import { getRandomItems, calculateScore } from '@/lib/utils'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.testId as string

  const [test, setTest] = useState<Test | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [studentName, setStudentName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{
    [key: string]: string[]
  }>({})

  useEffect(() => {
    fetchTestData()
  }, [testId])

  const fetchTestData = async () => {
    try {
      setLoading(true)
      const testData = await getTest(testId)

      if (!testData) {
        setError('Тест не найден')
        return
      }

      if (testData.status === 'closed') {
        setError('Этот тест закрыт преподавателем')
        return
      }

      setTest(testData)

      const questionsData = await getQuestionsByTest(testId)
      setAllQuestions(questionsData)
    } catch (err) {
      setError('Ошибка при загрузке теста')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async (name: string) => {
    if (!name.trim()) {
      setError('Пожалуйста, введи своё ФИО')
      return
    }

    if (!test) return

    try {
      setLoading(true)
      setStudentName(name)

      // Получить или создать прогресс ученика
      const progress = await getOrCreateStudentProgress(name, test.topicId)

      // Выбрать рандомные вопросы (исключая уже использованные)
      const usedQuestionIds = progress.levelProgress[test.level]?.usedQuestions || []
      const availableQuestions = allQuestions.filter(
        (q) => !usedQuestionIds.includes(q.id)
      )

      if (availableQuestions.length === 0) {
        setError('Все вопросы уже использованы в этом уровне')
        return
      }

      const selectedQuestions = getRandomItems(
        availableQuestions,
        Math.min(test.questionsPerTest, availableQuestions.length)
      )

      setCurrentQuestions(selectedQuestions)
      setShowNameInput(false)
      setCurrentQuestionIndex(0)
      setAnswers({})
    } catch (err) {
      setError('Ошибка при запуске теста')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, selectedOptionIds: string[]) => {
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
    if (!test) return

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
  attemptNumber: 1,
  selectedQuestions: currentQuestions.map((q) => q.id),
  answers: testAnswers,
  score: correct,
  totalQuestions: total,
  percentage,
  passed: percentage >= test.passingScore,
  completedAt: new Date(),
})

      // Обновить прогресс ученика
      const progress = await getOrCreateStudentProgress(
        studentName,
        test.topicId
      )

      const newLevelProgress = { ...progress.levelProgress }
      newLevelProgress[test.level] = {
        ...newLevelProgress[test.level],
        attempts: (newLevelProgress[test.level]?.attempts || 0) + 1,
        usedQuestions: [
          ...(newLevelProgress[test.level]?.usedQuestions || []),
          ...currentQuestions.map((q) => q.id),
        ],
        bestScore:
          percentage >
          (newLevelProgress[test.level]?.bestScore || 0)
            ? percentage
            : newLevelProgress[test.level]?.bestScore,
        status:
          percentage >= test.passingScore
            ? 'passed'
            : newLevelProgress[test.level]?.attempts >= test.maxAttempts
              ? 'failed'
              : 'in_progress',
      }

      await updateStudentProgress(progress.id, {
        levelProgress: newLevelProgress,
        currentLevel: test.level,
      })

      // Перейти на страницу результатов
      router.push(`/results/${resultId}`)
    } catch (err) {
      setError('Ошибка при сохранении результатов')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  // Если тест не загружен
  if (!test || (currentQuestions.length === 0 && !showNameInput)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error || 'Ошибка при загрузке теста'}</p>
        </div>
      </div>
    )
  }

  // Ввод ФИО
  if (showNameInput) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Введи своё ФИО
          </h2>
          <p className="text-gray-600 mb-6">
            Результаты теста будут сохранены под этим именем
          </p>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Например: Иван Петров"
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget as HTMLInputElement
                  handleStartTest(input.value)
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = (e.currentTarget as HTMLElement).previousElementSibling as HTMLInputElement
                handleStartTest(input.value)
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
            >
              Начать тест
            </button>
          </div>

          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Сам тест
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Вопрос {currentQuestionIndex + 1} из {currentQuestions.length}
          </h2>
          <span className="text-sm text-gray-600">
            {studentName}
          </span>
        </div>

        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`,
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
            handleAnswerSelect(currentQuestions[currentQuestionIndex].id, selectedIds)
          }
        />
      )}

      {/* Кнопки навигации */}
      <div className="mt-8 flex gap-4 justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>

        {currentQuestionIndex === currentQuestions.length - 1 ? (
          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50"
          >
            {submitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
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
  )
}