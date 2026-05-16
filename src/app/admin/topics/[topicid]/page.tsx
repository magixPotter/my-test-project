'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import QuestionEditor from '@/components/QuestionEditor'
import { Topic, Test, Question } from '@/types'
import { updateTopicTestsStatus } from '@/lib/db'
import {
  getTopic,
  getTestsByTopic,
  getQuestionsByTest,
  deleteQuestion,
  updateTopic,
  updateTest,
} from '@/lib/db'

export default function EditTopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.topicid as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [questionsMap, setQuestionsMap] = useState<{
    [key: string]: Question[]
  }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Форма редактирования темы
  const [editMode, setEditMode] = useState(false)
  const [topicForm, setTopicForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
  })
  const [showDeleteTopicConfirm, setShowDeleteTopicConfirm] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<'active' | 'closed'>('active')

  // Форма редактирования тестов
  const [editTestMode, setEditTestMode] = useState<string | null>(null)
  const [testFormData, setTestFormData] = useState<{
    [key: string]: {
      maxAttempts: number
      questionsPerTest: number
      passingScore: number
    }
  }>({})

  // Диалог редактора вопросов
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  // Удаление вопроса
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [topicId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const topicData = await getTopic(topicId)

      if (!topicData) {
        setError('Тақырып табылмады')
        return
      }

      setTopic(topicData)
      setTopicForm({
        name: topicData.name,
        description: topicData.description,
        imageUrl: topicData.imageUrl,
      })

      const testsData = await getTestsByTopic(topicId)
      setTests(testsData)

      const testFormInit: {
        [key: string]: {
          maxAttempts: number
          questionsPerTest: number
          passingScore: number
        }
      } = {}
      for (const test of testsData) {
        testFormInit[test.id] = {
          maxAttempts: test.maxAttempts,
          questionsPerTest: test.questionsPerTest,
          passingScore: test.passingScore,
        }
      }
      setTestFormData(testFormInit)

      const questionsData: { [key: string]: Question[] } = {}
      for (const test of testsData) {
        const questions = await getQuestionsByTest(test.id)
        questionsData[test.id] = questions
      }
      setQuestionsMap(questionsData)
    } catch (err) {
      setError('Деректерді жүктеу кезінде қате')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topicForm.name.trim()) {
      setError('Тақырып атауын енгізіңіз')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      await updateTopic(topicId, topicForm.name, topicForm.description, topicForm.imageUrl)

      setTopic({
        ...topic!,
        ...topicForm,
      })
      setEditMode(false)
    } catch (err) {
      setError('Тақырыпты сақтау кезінде қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeTopicStatus = async () => {
    try {
      setSubmitting(true)
      setError('')

      await updateTopic(topicId, topic!.name, topic!.description, topic!.imageUrl, newStatus)
      await updateTopicTestsStatus(topicId, newStatus)

      setTopic({
        ...topic!,
        status: newStatus,
      })

      setShowStatusDialog(false)
    } catch (err) {
      setError('Мәртебе өзгерту кезіндегі қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!topic) return

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`/api/topics?id=${topicId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Тақырыпты жою кезіндегі қате')
        return
      }

      router.push('/admin/topics')
    } catch (err) {
      setError('Тақырыпты жою кезіндегі қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveTestSettings = async (testId: string) => {
    const settings = testFormData[testId]

    if (!settings) return

    try {
      setSubmitting(true)
      setError('')

      await updateTest(testId, {
        maxAttempts: settings.maxAttempts,
        questionsPerTest: settings.questionsPerTest,
        passingScore: settings.passingScore,
      })

      setTests((prev) =>
        prev.map((test) =>
          test.id === testId
            ? {
                ...test,
                maxAttempts: settings.maxAttempts,
                questionsPerTest: settings.questionsPerTest,
                passingScore: settings.passingScore,
              }
            : test
        )
      )

      setEditTestMode(null)
    } catch (err) {
      setError('Сынақ параметрлерін сақтау кезінде қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveQuestion = async (questionData: any) => {
    if (!selectedTestId) return

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionData,
          testId: selectedTestId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Сұрақты сақтау кезінде қате')
      }

      const questions = await getQuestionsByTest(selectedTestId)
      setQuestionsMap((prev) => ({
        ...prev,
        [selectedTestId]: questions,
      }))

      setShowQuestionEditor(false)
      setEditingQuestion(null)
      setSelectedTestId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сұрақты сақтау кезінде қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditQuestion = (question: Question, testId: string) => {
    setEditingQuestion(question)
    setSelectedTestId(testId)
    setShowQuestionEditor(true)
  }

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return

    try {
      setSubmitting(true)
      setError('')

      await deleteQuestion(questionToDelete)

      const testId = Object.keys(questionsMap).find((tId) =>
        questionsMap[tId].some((q) => q.id === questionToDelete)
      )

      if (testId) {
        const questions = await getQuestionsByTest(testId)
        setQuestionsMap((prev) => ({
          ...prev,
          [testId]: questions,
        }))
      }

      setQuestionToDelete(null)
      setShowDeleteConfirm(false)
    } catch (err) {
      setError('Сұрақты жою кезіндегі қате')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      multipleChoice: '1) Бірнеше нұсқалы',
      freeText: '2) Ашық жауап',
      matching: '3) Сәйкестендіру',
      fillInTheBlank: '4) Пропускты толтыру',
    }
    return labels[type] || type
  }

  if (loading) return <LoadingSpinner />

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="text-center text-red-600">
          <p className="text-base md:text-lg font-semibold">{error || 'Тақырып табылмады'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <Link href="/admin/topics" className="text-blue-600 hover:underline mb-4 md:mb-6 inline-block text-sm md:text-base font-semibold">
        ← Тақырыптарға оралу
      </Link>

      {error && (
        <div className="mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
          {error}
        </div>
      )}

      {/* Редактирование темы */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{topic.name}</h1>
            <p className="text-xs md:text-sm mt-2">
              Мәртебе:{' '}
              <span
                className={`font-semibold ${
                  topic.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {topic.status === 'active' ? '🟢 Ашық' : '🔴 Жабық'}
              </span>
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={() => {
                setNewStatus(topic.status === 'active' ? 'closed' : 'active')
                setShowStatusDialog(true)
              }}
              className={`w-full md:w-auto px-3 md:px-4 py-2 text-white rounded font-semibold transition text-sm md:text-base ${
                topic.status === 'active'
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {topic.status === 'active' ? 'Кіруді жабу' : '🟢 Кіруді ашу'}
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className="w-full md:w-auto px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-semibold transition text-sm md:text-base"
            >
              {editMode ? '✖ Бас тарту' : '✏ Өңдеу'}
            </button>
            <button
              onClick={() => setShowDeleteTopicConfirm(true)}
              className="w-full md:w-auto px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded font-semibold transition text-sm md:text-base"
            >
              🗑 Тақырыпты жою
            </button>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSaveTopic} className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Атауы
              </label>
              <input
                type="text"
                value={topicForm.name}
                onChange={(e) =>
                  setTopicForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Сипаттама
              </label>
              <textarea
                value={topicForm.description}
                onChange={(e) =>
                  setTopicForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                URL суреті
              </label>
              <input
                type="url"
                value={topicForm.imageUrl}
                onChange={(e) =>
                  setTopicForm((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                  }))
                }
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded font-semibold transition disabled:opacity-50 text-sm md:text-base"
            >
              {submitting ? 'Сақталуда...' : 'Сақтау'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 mb-4 text-sm md:text-base">{topic.description}</p>
            {topic.imageUrl && (
              <div className="w-full max-w-xs md:max-w-md rounded overflow-hidden">
                <img
                  src={topic.imageUrl}
                  alt={topic.name}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Тесты и вопросы */}
      <div className="space-y-6 md:space-y-8">
        {['A', 'B', 'C'].map((level) => {
          const test = tests.find((t) => t.level === level)
          const questions = test ? questionsMap[test.id] || [] : []
          const isEditingTest = editTestMode === test?.id

          return (
            <div key={level} className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                Деңгей {level}
              </h2>

              {!test ? (
                <p className="text-gray-500 text-sm md:text-base">Тест жасалмады</p>
              ) : (
                <div>
                  {/* Настройки теста */}
                  <div className="bg-gray-50 p-3 md:p-4 rounded mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Максималды әрекет</p>
                        {isEditingTest ? (
                          <input
                            type="number"
                            min="1"
                            value={testFormData[test.id]?.maxAttempts || 1}
                            onChange={(e) =>
                              setTestFormData((prev) => ({
                                ...prev,
                                [test.id]: {
                                  ...prev[test.id],
                                  maxAttempts: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-lg md:text-2xl font-semibold text-gray-900">
                            {test.maxAttempts}
                          </p>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Тесттегі сұрақтар</p>
                        {isEditingTest ? (
                          <input
                            type="number"
                            min="1"
                            value={testFormData[test.id]?.questionsPerTest || 1}
                            onChange={(e) =>
                              setTestFormData((prev) => ({
                                ...prev,
                                [test.id]: {
                                  ...prev[test.id],
                                  questionsPerTest: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-lg md:text-2xl font-semibold text-gray-900">
                            {test.questionsPerTest}
                          </p>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Өту балы (%)</p>
                        {isEditingTest ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={testFormData[test.id]?.passingScore || 60}
                            onChange={(e) =>
                              setTestFormData((prev) => ({
                                ...prev,
                                [test.id]: {
                                  ...prev[test.id],
                                  passingScore: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                          />
                        ) : (
                          <p className="text-lg md:text-2xl font-semibold text-gray-900">
                            {test.passingScore}%
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditingTest ? (
                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={() => handleSaveTestSettings(test.id)}
                          disabled={submitting}
                          className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50 text-sm md:text-base"
                        >
                          ✓ Сақтау
                        </button>
                        <button
                          onClick={() => setEditTestMode(null)}
                          className="w-full md:w-auto px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold transition text-sm md:text-base"
                        >
                          ✖ Бас тарту
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditTestMode(test.id)}
                        className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition text-sm md:text-base"
                      >
                        ✏ Өңдеу
                      </button>
                    )}

                    <p className="text-xs md:text-sm text-gray-600 mt-4">
                      Банктегі барлық сұрақтар: <strong>{questions.length}</strong>
                    </p>
                  </div>

                  {/* Добавить вопрос */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setSelectedTestId(test.id)
                        setEditingQuestion(null)
                        setShowQuestionEditor(true)
                      }}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition text-sm md:text-base"
                    >
                      + Сұрақ қосу
                    </button>
                  </div>

                  {/* Список вопросов */}
                  {questions.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">
                      Сұрақтар қосылмаған
                    </p>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {questions.map((question, idx) => (
                        <div
                          key={question.id}
                          className="p-3 md:p-4 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-start gap-2 mb-1">
                                <span className="text-xs md:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {getQuestionTypeLabel(question.type)}
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 text-sm md:text-base break-words">
                                {idx + 1}. {question.text}
                              </p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                onClick={() =>
                                  handleEditQuestion(question, test.id)
                                }
                                className="flex-1 md:flex-none px-2 md:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs md:text-sm transition"
                              >
                                ✏ Өңдеу
                              </button>
                              <button
                                onClick={() => {
                                  setQuestionToDelete(question.id)
                                  setShowDeleteConfirm(true)
                                }}
                                className="flex-1 md:flex-none px-2 md:px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs md:text-sm transition"
                              >
                                🗑 Жою
                              </button>
                            </div>
                          </div>

                          {question.instruction && (
                            <p className="text-xs text-gray-600 mb-2 italic">
                              💡 Инструкция: {question.instruction}
                            </p>
                          )}

                          {question.type === 'multipleChoice' && (
                            <div className="text-xs md:text-sm text-gray-600 mt-2">
                              <p className="mb-1">Варианты:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {question.options.map((option: any, optIdx: number) => (
                                  <li
                                    key={optIdx}
                                    className={option.isCorrect ? 'text-green-600 font-semibold' : ''}
                                  >
                                    {option.text} {option.isCorrect && '✓ (дұрыс)'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {question.type === 'freeText' && (
                            <div className="text-xs md:text-sm text-gray-600 mt-2">
                              <p className="mb-1">Жақсы жауаптар:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {(question.options as any)[0]?.variations?.map(
                                  (v: string, vIdx: number) => (
                                    <li key={vIdx}>{v}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {question.type === 'matching' && (
                            <div className="text-xs md:text-sm text-gray-600 mt-2">
                              <p>
                                Пара: {(question.options as any)[0]?.pairs?.length || 0} | Көрсету: {(question.options as any)[0]?.displayPairCount || 0}
                              </p>
                            </div>
                          )}

                          {question.type === 'fillInTheBlank' && (
                            <div className="text-xs md:text-sm text-gray-600 mt-2">
                              <p className="mb-1">
                                Мәтін: {(question.options as any)[0]?.fullText}
                              </p>
                              <p className="mb-1">Жақсы жауаптар:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {(question.options as any)[0]?.variations?.map(
                                  (v: string, vIdx: number) => (
                                    <li key={vIdx}>{v}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {question.explanation && (
                            <p className="text-xs md:text-sm text-gray-600 mt-2">
                              <strong>Түсіндіру:</strong> {question.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Question Editor Modal */}
      {showQuestionEditor && selectedTestId && (
        <QuestionEditor
          testId={selectedTestId}
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowQuestionEditor(false)
            setEditingQuestion(null)
            setSelectedTestId(null)
          }}
          isSubmitting={submitting}
        />
      )}

      {/* Диалоги подтверждения */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Сұрақты жою керек пе?"
          message="Бұл әрекетті қайтару мүмкін емес. Сұрақ барлық қатысты деректермен жойылады."
          confirmText="Жою"
          cancelText="Бас тарту"
          isLoading={submitting}
          onConfirm={handleDeleteQuestion}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setQuestionToDelete(null)
          }}
        />
      )}
      {showStatusDialog && (
        <ConfirmDialog
          title={`${newStatus === 'closed' ? 'Доступ жабу' : 'Доступ ашу'}`}
          message={
            newStatus === 'closed'
              ? 'Оқушылар жаңа әрекеттерді бастай алмайды. Тапсырылған тесттердің нәтижелері сақталады.'
              : 'Оқушылар осы тақырып бойынша тест тапсыра алады.'
          }
          confirmText={newStatus === 'closed' ? 'Жабу' : 'Ашу'}
          cancelText="Бас тарту"
          isLoading={submitting}
          onConfirm={handleChangeTopicStatus}
          onCancel={() => setShowStatusDialog(false)}
        />
      )}
      {showDeleteTopicConfirm && (
        <ConfirmDialog
          title="Тақырыпты жою керек пе?"
          message={`Сіз "${topic?.name}" тақырыбын жойғыңыз келеді. Бұл әрекетті қайтару мүмкін емес. Барлық сынақтар, сұрақтар мен нәтижелер жойылады.`}
          confirmText="Жою"
          cancelText="Бас тарту"
          isLoading={submitting}
          onConfirm={handleDeleteTopic}
          onCancel={() => {
            setShowDeleteTopicConfirm(false)
            setError('')
          }}
        />
      )}
    </div>
  )
}