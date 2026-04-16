'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Topic } from '@/types'
import { getTopics } from '@/lib/db'
import { useStudent } from '@/context/StudentContext'

export default function StudentPage() {
  const router = useRouter()
  const { studentName, setStudentName, isLoading: contextLoading } = useStudent()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    if (contextLoading) return

    if (!studentName) {
      setShowNameDialog(true)
    }
    fetchTopics()
  }, [studentName, contextLoading])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const allTopics = await getTopics()
      const activeTopics = allTopics.filter((t) => t.status === 'active')
      setTopics(activeTopics)
    } catch (err) {
      setError('Тақырыптарды жүктеу кезінде қате')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempName.trim()) {
      setError('Өз атыңызды енгізіңіз')
      return
    }

    try {
      const response = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: tempName }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Кіру кезінде қате')
        return
      }

      setStudentName(tempName)
      setShowNameDialog(false)
      setError('')
    } catch (err) {
      setError('Кіру кезінде қате')
      console.error(err)
    }
  }

  if (contextLoading || loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Диалог ввода имени */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Өз атыңызды енгізіңіз
            </h2>

            <form onSubmit={handleSetName} className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Оқушының аты-жөні *
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Мысалы: Иван Иванов"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  autoFocus
                />
              </div>

              {error && <div className="text-red-600 text-xs md:text-sm">{error}</div>}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-semibold transition text-sm md:text-base"
              >
                Бастау
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Заголовок */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div className="w-full">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 break-words">
              📚 Тестілеу үшін тақырыпты таңдаңыз
            </h1>
            {studentName && (
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                Сәлем, <span className="font-semibold">{studentName}</span>! 👋
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setStudentName('')
              setShowNameDialog(true)
              setTempName('')
            }}
            className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded font-semibold transition text-sm md:text-base"
          >
            Шығу
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
            {error}
          </div>
        )}

        {/* Список тем */}
        {topics.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-lg md:text-xl text-gray-600 px-2">
              Уақытша тестілеу тақырыптары жоқ 😔
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/student/topic/${topic.id}`}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="w-full h-40 md:h-48 bg-gray-200 overflow-hidden">
                  {topic.imageUrl ? (
                    <img
                      src={topic.imageUrl}
                      alt={topic.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl md:text-4xl">
                      📚
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                    {topic.name}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-4">
                    {topic.description}
                  </p>

                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white rounded font-semibold transition text-sm md:text-base">
                    Тестті бастаңыз →
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}