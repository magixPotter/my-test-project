'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { closeAllTests, openAllTests } from '@/lib/db'

export default function AdminControlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [action, setAction] = useState<'close' | 'open' | null>(null)

  const handleCloseTests = async () => {
    try {
      setLoading(true)
      setError('')
      await closeAllTests()
      setSuccess('✅ Все тесты закрыты. Ученики больше не могут их проходить.')
      setShowConfirm(false)
      setAction(null)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Ошибка при закрытии тестов')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTests = async () => {
    try {
      setLoading(true)
      setError('')
      await openAllTests()
      setSuccess('✅ Все тесты открыты. Ученики могут проходить тесты.')
      setShowConfirm(false)
      setAction(null)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Ошибка при открытии тестов')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        🎛️ Управление доступом к тестам
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Карточки управления */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Закрыть все тесты */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔒 Закрыть доступ
          </h2>
          <p className="text-gray-600 mb-6">
            После закрытия все ученики не смогут проходить тесты. Результаты текущих прохождений будут сохранены.
          </p>
          <button
            onClick={() => {
              setAction('close')
              setShowConfirm(true)
            }}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
            disabled={loading}
          >
            {loading && action === 'close' ? 'Закрытие...' : 'Закрыть все тесты'}
          </button>
        </div>

        {/* Открыть все тесты */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔓 Открыть доступ
          </h2>
          <p className="text-gray-600 mb-6">
            После открытия все ученики смогут проходить тесты и видеть все доступные уровни.
          </p>
          <button
            onClick={() => {
              setAction('open')
              setShowConfirm(true)
            }}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition"
            disabled={loading}
          >
            {loading && action === 'open' ? 'Открытие...' : 'Открыть все тесты'}
          </button>
        </div>
      </div>

      {/* Информационный блок */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Как это работает:
        </h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>✓ Нажми "Закрыть все тесты" когда заканчивается урок</li>
          <li>✓ Все текущие результаты будут автоматически сохранены</li>
          <li>✓ Нажми "Открыть все тесты" перед следующим уроком</li>
          <li>✓ Ученики смогут видеть свои результаты в любой момент</li>
        </ul>
      </div>

      {/* Диалог подтверждения */}
      {showConfirm && (
        <ConfirmDialog
          title={
            action === 'close'
              ? 'Закрыть все тесты?'
              : 'Открыть все тесты?'
          }
          message={
            action === 'close'
              ? 'Это закроет доступ ко всем тестам для учеников. Результаты текущих попыток будут сохранены. Уверен?'
              : 'Это откроет доступ ко всем тестам для учеников. Уверен?'
          }
          confirmText={action === 'close' ? 'Закрыть' : 'Открыть'}
          cancelText="Отмена"
          isLoading={loading}
          onConfirm={
            action === 'close' ? handleCloseTests : handleOpenTests
          }
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}