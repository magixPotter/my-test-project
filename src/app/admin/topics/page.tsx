'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Topic } from '@/types'
import Image from 'next/image'

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  // Форма
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/topics')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (err) {
      setError('Ошибка при загрузке тем')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Введи название темы')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при создании темы')
        return
      }

      // Перезагрузить темы
      await fetchTopics()

      // Очистить форму
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
      })
      setShowDialog(false)
    } catch (err) {
      setError('Ошибка при создании темы')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return

    try {
      setSubmitting(true)
      setError('')

      console.log('Deleting topic:', topicToDelete.id)

      const response = await fetch(`/api/topics?id=${topicToDelete.id}`, {
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

      // Удалить тему из списка
      setTopics((prev) => prev.filter((t) => t.id !== topicToDelete.id))
      setShowDeleteConfirm(false)
      setTopicToDelete(null)
      setError('')
    } catch (err) {
      setError('Ошибка при удалении темы')
      console.error('Delete error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">📚 Управление темами</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
        >
          + Добавить тему
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Список тем */}
      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Темы не найдены</p>
          <p className="text-sm">Нажми кнопку 'Добавить тему' чтобы создать новую</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition relative"
            >
              {/* Иконка статуса */}
              <div className="absolute top-2 right-2 z-10">
                <span
                  className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                    topic.status === 'active'
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}
                >
                  {topic.status === 'active' ? '🟢 Открыта' : '🔴 Закрыта'}
                </span>
              </div>

              <Link href={`/admin/topics/${topic.id}`} className="block">
                <div className="relative w-full h-48 bg-gray-200">
                  {topic.imageUrl && (
                    <Image
                      src={topic.imageUrl}
                      alt={topic.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {topic.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {topic.description}
                  </p>
                </div>
              </Link>

              {/* Кнопка удаления */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => {
                    setTopicToDelete(topic)
                    setShowDeleteConfirm(true)
                  }}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition text-sm"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог добавления темы */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Добавить новую тему
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название темы *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Например: Механика"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание темы
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Описание темы..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* URL картинки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL картинки
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Пока используй URL картинок из интернета. В будущем добавим загрузку файлов.
                </p>
              </div>

              {/* Кнопки */}
              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
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
                  {submitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirm && topicToDelete && (
        <ConfirmDialog
          title="Удалить тему?"
          message={`Вы собираетесь удалить тему "${topicToDelete.name}". Это действие невозможно отменить. Все тесты, вопросы и результаты студентов, связанные с этой темой, также будут удалены.`}
          confirmText="Удалить"
          cancelText="Отмена"
          isLoading={submitting}
          onConfirm={handleDeleteTopic}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setTopicToDelete(null)
            setError('')
          }}
        />
      )}
    </div>
  )
}