'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ResultsTable from '@/components/ResultsTable'
import { getAllResults } from '@/lib/db'
import { TestResult } from '@/types'

export default function AdminResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Фильтры
  const [studentNameFilter, setStudentNameFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const data = await getAllResults()
      setResults(data)
      setFilteredResults(data)
    } catch (err) {
      setError('Ошибка при загрузке результатов')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Применить фильтры
  useEffect(() => {
    let filtered = results

    if (studentNameFilter) {
      filtered = filtered.filter((r) =>
        r.studentName
          .toLowerCase()
          .includes(studentNameFilter.toLowerCase())
      )
    }

    if (levelFilter) {
      filtered = filtered.filter((r) => r.testLevel === levelFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter((r) =>
        statusFilter === 'passed' ? r.passed : !r.passed
      )
    }

    setFilteredResults(filtered)
  }, [results, studentNameFilter, levelFilter, statusFilter])

  const handleExportCSV = () => {
    const headers = [
      'ФИО',
      'Тема',
      'Уровень',
      'Попытка',
      'Результат',
      'Статус',
      'Дата',
    ]
    const rows = filteredResults.map((r) => [
      r.studentName,
      r.topicId,
      r.testLevel,
      r.attemptNumber,
      `${r.score}/${r.totalQuestions} (${r.percentage}%)`,
      r.passed ? 'Пройден' : 'Не пройден',
      new Date(r.completedAt).toLocaleString('ru-RU'),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `results_${new Date().toISOString()}.csv`
    link.click()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        📊 Результаты тестов
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Фильтры</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ФИО */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО ученика
            </label>
            <input
              type="text"
              placeholder="Поиск по ФИО"
              value={studentNameFilter}
              onChange={(e) => setStudentNameFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Уровень */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Все уровни</option>
              <option value="A">Уровень A</option>
              <option value="B">Уровень B</option>
              <option value="C">Уровень C</option>
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Все</option>
              <option value="passed">Пройдены</option>
              <option value="failed">Не пройдены</option>
            </select>
          </div>

          {/* Экспорт */}
          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition"
            >
              📥 Экспортировать CSV
            </button>
          </div>
        </div>
      </div>

      {/* Таблица результатов */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Всего записей: {filteredResults.length}
        </h2>
        <ResultsTable results={filteredResults} />
      </div>
    </div>
  )
}