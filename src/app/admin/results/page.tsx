'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ResultsTable from '@/components/ResultsTable'
import { getAllResultsWithTopicNames } from '@/lib/db'
import { TestResult } from '@/types'

export default function AdminResultsPage() {
  const [results, setResults] = useState<(TestResult & { topicName: string })[]>([])
  const [filteredResults, setFilteredResults] = useState<(TestResult & { topicName: string })[]>([])
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
      const data = await getAllResultsWithTopicNames()
      console.log('📊 Атаулары бар нәтижелер:', data)
      setResults(data)
      setFilteredResults(data)
    } catch (err) {
      setError('Нәтижелерді жүктеу кезінде қате пайда болды')
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
      'Аты-жөні',
      'Тақырып',
      'Деңгей',
      'Әрекет',
      'Нәтиже',
      'Мәртебе',
    ]
    const rows = filteredResults.map((r) => [
      r.studentName,
      r.topicName, 
      r.testLevel,
      r.attemptNumber,
      `${r.score}/${r.totalQuestions} (${r.percentage}%)`,
      r.passed ? 'Өтті' : 'Өтпеген',
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
        📊 Тест нәтижелері
      </h1>

      {error && (
        <div className="mb-6 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
          {error}
        </div>
      )}

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Фильтр</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* ФИО */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Оқушының аты-жөні
            </label>
            <input
              type="text"
              placeholder="Аты жөні бойынша іздеу"
              value={studentNameFilter}
              onChange={(e) => setStudentNameFilter(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Уровень */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Деңгей
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            >
              <option value="">Барлық деңгейлер</option>
              <option value="A">A Деңгейі</option>
              <option value="B">B Деңгейі</option>
              <option value="C">C Деңгейі</option>
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            >
              <option value="">Барлығы</option>
              <option value="passed">Өтті</option>
              <option value="failed">Өтпеген</option>
            </select>
          </div>

          {/* Экспорт */}
          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded font-semibold transition text-sm md:text-base"
            >
              📥 CSV экспорты
            </button>
          </div>
        </div>
      </div>

      {/* Таблица результатов */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 overflow-x-auto">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Барлық жазбалар: {filteredResults.length}
        </h2>
        <ResultsTable results={filteredResults} />
      </div>
    </div>
  )
}