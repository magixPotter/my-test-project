'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Topic, Test, Question } from '@/types'
import { updateTopicTestsStatus } from '@/lib/db'
import {
  getTopic,
  getTestsByTopic,
  getQuestionsByTest,
  createQuestion,
  updateQuestion,
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

  // Форма редактирования тестов (кол-во попыток, вопросов и проходной балл)
  const [editTestMode, setEditTestMode] = useState<string | null>(null)
  const [testFormData, setTestFormData] = useState<{
    [key: string]: {
      maxAttempts: number
      questionsPerTest: number
      passingScore: number
    }
  }>({})

  // Форма добавления/редактирования вопроса
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
  })

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
        setError('Тема не найдена')
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

      // Инициализировать форму редактирования тестов
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

      // Загрузить вопросы для каждого теста
      const questionsData: { [key: string]: Question[] } = {}
      for (const test of testsData) {
        const questions = await getQuestionsByTest(test.id)
        questionsData[test.id] = questions
      }
      setQuestionsMap(questionsData)
    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topicForm.name.trim()) {
      setError('Введи название темы')
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
      setError('Ошибка при сохранении темы')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeTopicStatus = async () => {
  try {
    setSubmitting(true)
    setError('')

    // Обновляем сам Topic
    await updateTopic(topicId, topic!.name, topic!.description, topic!.imageUrl, newStatus)

    // Обновляем все тесты по этой теме
    await updateTopicTestsStatus(topicId, newStatus)

    setTopic({
      ...topic!,
      status: newStatus,
    })

    setShowStatusDialog(false)
  } catch (err) {
    setError('Ошибка при изменении статуса')
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

    console.log('Deleting topic:', topicId)

    const response = await fetch(`/api/topics?id=${topicId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    console.log('Delete response status:', response.status)
    const data = await response.json()
    console.log('Delete response data:', data)

    if (!response.ok) {
      setError(data.error || 'Ошибка при удалении темы')
      return
    }

    // Перейти на страницу списка тем
    router.push('/admin/topics')
  } catch (err) {
    setError('Ошибка при удалении темы')
    console.error('Delete error:', err)
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

      // Обновить локальное состояние
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
      setError('Ошибка при сохранении настроек теста')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddOrEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTestId || !questionForm.text.trim()) {
      setError('Заполни все поля')
      return
    }

    const filledOptions = questionForm.options.filter((opt) => opt.text.trim())
    if (filledOptions.length < 2) {
      setError('Нужно минимум 2 варианта ответа')
      return
    }

    if (!filledOptions.some((opt) => opt.isCorrect)) {
      setError('Отметь правильный ответ')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (editingQuestionId) {
        // Редактирование существующего вопроса
        await updateQuestion(
          editingQuestionId,
          questionForm.text,
          filledOptions,
          questionForm.explanation
        )
      } else {
        // Создание нового вопроса
        await createQuestion(
          selectedTestId,
          questionForm.text,
          filledOptions,
          questionForm.explanation
        )
      }

      // Перезагрузить вопросы
      const questions = await getQuestionsByTest(selectedTestId)
      setQuestionsMap((prev) => ({
        ...prev,
        [selectedTestId]: questions,
      }))

      // Очистить форму
      setQuestionForm({
        text: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        explanation: '',
      })
      setShowQuestionDialog(false)
      setSelectedTestId(null)
      setEditingQuestionId(null)
    } catch (err) {
      setError('Ошибка при сохранении вопроса')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditQuestion = (question: Question, testId: string) => {
  if (!testId) return
  
  setEditingQuestionId(question.id)
  setSelectedTestId(testId)
  setQuestionForm({
    text: question.text,
    options: question.options,
    explanation: question.explanation,
  })
  setShowQuestionDialog(true)
}

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return

    try {
      setSubmitting(true)
      setError('')

      await deleteQuestion(questionToDelete)

      // Перезагрузить вопросы
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
      setError('Ошибка при удалении вопроса')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const addOptionField = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }))
  }

  const removeOptionField = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  if (loading) return <LoadingSpinner />

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error || 'Тема не найдена'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/admin/topics" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Вернуться к темам
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Редактирование темы */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
    <p className="text-sm mt-2">
      Статус:{' '}
      <span
        className={`font-semibold ${
          topic.status === 'active' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {topic.status === 'active' ? '🟢 Открыта' : '🔴 Закрыта'}
      </span>
    </p>
  </div>
  <div className="flex gap-2">
    <button
      onClick={() => {
        setNewStatus(topic.status === 'active' ? 'closed' : 'active')
        setShowStatusDialog(true)
      }}
      className={`px-4 py-2 text-white rounded font-semibold transition ${
        topic.status === 'active'
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {topic.status === 'active' ? '🔴 Закрыть доступ' : '🟢 Открыть доступ'}
    </button>
    <button
      onClick={() => setEditMode(!editMode)}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
    >
      {editMode ? '✖ Отмена' : '✏ Редактировать'}
    </button>
    <button
      onClick={() => setShowDeleteTopicConfirm(true)}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
    >
      🗑 Удалить тему
    </button>
  </div>
</div>

        {editMode ? (
          <form onSubmit={handleSaveTopic} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL картинки
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">{topic.description}</p>
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
        )}
      </div>

      {/* Тесты и вопросы */}
      <div className="space-y-8">
        {['A', 'B', 'C'].map((level) => {
          const test = tests.find((t) => t.level === level)
          const questions = test ? questionsMap[test.id] || [] : []
          const isEditingTest = editTestMode === test?.id

          return (
            <div key={level} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Уровень {level}
                </h2>
              </div>

              {!test ? (
                <p className="text-gray-500">Тест не создан</p>
              ) : (
                <div>
                  {/* Настройки теста */}
                  <div className="bg-gray-50 p-4 rounded mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div>
                          <p className="text-sm text-gray-600">Максимум попыток</p>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">
                              {test.maxAttempts}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Вопросов в тесте</p>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">
                              {test.questionsPerTest}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Проходной балл (%)</p>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">
                              {test.passingScore}%
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditingTest ? (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleSaveTestSettings(test.id)}
                            disabled={submitting}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50"
                          >
                            ✓ Сохранить
                          </button>
                          <button
                            onClick={() => setEditTestMode(null)}
                            className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold transition"
                          >
                            ✖ Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditTestMode(test.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition ml-4"
                        >
                          ✏ Редактировать
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      Всего вопросов в банке: <strong>{questions.length}</strong>
                    </p>
                  </div>

                  {/* Добавить вопрос */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setSelectedTestId(test.id)
                        setEditingQuestionId(null)
                        setQuestionForm({
                          text: '',
                          options: [
                            { text: '', isCorrect: false },
                            { text: '', isCorrect: false },
                          ],
                          explanation: '',
                        })
                        setShowQuestionDialog(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                    >
                      + Добавить вопрос
                    </button>
                  </div>

                  {/* Список вопросов */}
                  {questions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Вопросы не добавлены
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question, idx) => (
                        <div
                          key={question.id}
                          className="p-4 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-gray-900 flex-1">
                              {idx + 1}. {question.text}
                            </p>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() =>
                                  handleEditQuestion(question, test.id)
                                }
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                              >
                                ✏ Редактировать
                              </button>
                              <button
                                onClick={() => {
                                  setQuestionToDelete(question.id)
                                  setShowDeleteConfirm(true)
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                              >
                                🗑 Удалить
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <p className="mb-2">Варианты:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {question.options.map((option, optIdx) => (
                                <li
                                  key={optIdx}
                                  className={
                                    option.isCorrect
                                      ? 'text-green-600 font-semibold'
                                      : ''
                                  }
                                >
                                  {option.text}{' '}
                                  {option.isCorrect && '✓ (правильный)'}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {question.explanation && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Объяснение:</strong> {question.explanation}
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

      {/* Диалог добавления/редактирования вопроса */}
      {showQuestionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingQuestionId ? 'Редактировать вопрос' : 'Добавить вопрос'}
            </h2>

            <form onSubmit={handleAddOrEditQuestion} className="space-y-4">
              {/* Текст вопроса */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст вопроса *
                </label>
                <textarea
                  value={questionForm.text}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Варианты ответов */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Варианты ответов *
                </label>
                <div className="space-y-2">
                  {questionForm.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options]
                          newOptions[idx].isCorrect = e.target.checked
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: newOptions,
                          }))
                        }}
                        className="w-4 h-4"
                        title="Отметь правильный ответ"
                      />
                      <input
                        type="text"
                        placeholder={`Вариант ${idx + 1}`}
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options]
                          newOptions[idx].text = e.target.value
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: newOptions,
                          }))
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      {questionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionField(idx)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addOptionField}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition text-sm"
                >
                  + Добавить вариант
                </button>
              </div>

              {/* Объяснение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Объяснение (опционально)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuestionDialog(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded transition disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition disabled:opacity-50"
                >
                  {submitting
                    ? 'Сохранение...'
                    : editingQuestionId
                      ? 'Обновить'
                      : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Диалог удаления вопроса */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Удалить вопрос?"
          message="Это действие невозможно отменить. Вопрос будет удалён со всеми связанными данными."
          confirmText="Удалить"
          cancelText="Отмена"
          isLoading={submitting}
          onConfirm={handleDeleteQuestion}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setQuestionToDelete(null)
          }}
        />
      )}
      {/* Диалог смены статуса темы */}
{showStatusDialog && (
  <ConfirmDialog
    title={`${newStatus === 'closed' ? 'Закрыть' : 'Открыть'} доступ?`}
    message={
      newStatus === 'closed'
        ? 'Ученики не смогут начать новые попытки. Результаты уже сданных тестов сохранятся.'
        : 'Ученики смогут пройти тесты по этой теме.'
    }
    confirmText={newStatus === 'closed' ? 'Закрыть' : 'Открыть'}
    cancelText="Отмена"
    isLoading={submitting}
    onConfirm={handleChangeTopicStatus}
    onCancel={() => setShowStatusDialog(false)}
  />
)}
    {/* Диалог удаления темы */}
{showDeleteTopicConfirm && (
  <ConfirmDialog
    title="Удалить тему?"
    message={`Вы собираетесь удалить тему "${topic?.name}". Это действие невозможно отменить. Все тесты, вопросы и результаты студентов, связанные с этой темой, также будут удалены.`}
    confirmText="Удалить"
    cancelText="Отмена"
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