'use client'

import { useEffect, useState, useMemo } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ResultsTable from '@/components/ResultsTable'
import { getAllResultsWithTopicNames } from '@/lib/db'
import { TestResult } from '@/types'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multipleChoice: '☑️ Тест',
  freeText: '✍️ Ашық жауап',
  matching: '🔗 Сәйкестендіру',
  fillInTheBlank: '📝 Пропуск',
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<(TestResult & { topicName: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Фильтры
  const [studentNameFilter, setStudentNameFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [questionTypeFilter, setQuestionTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const data = await getAllResultsWithTopicNames()
      setResults(data)
    } catch (err) {
      setError('Нәтижелерді жүктеу кезінде қате пайда болды')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Уникальные темы для фильтра
  const uniqueTopics = useMemo(() => {
    const seen = new Set<string>()
    return results
      .map((r) => ({ id: r.topicId, name: r.topicName }))
      .filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [results])

  // Применить фильтры
  const filteredResults = useMemo(() => {
    let filtered = results

    if (studentNameFilter)
      filtered = filtered.filter((r) =>
        r.studentName.toLowerCase().includes(studentNameFilter.toLowerCase())
      )

    if (topicFilter)
      filtered = filtered.filter((r) => r.topicId === topicFilter)

    if (levelFilter)
      filtered = filtered.filter((r) => r.testLevel === levelFilter)

    if (questionTypeFilter)
      filtered = filtered.filter((r) => (r.questionType || 'multipleChoice') === questionTypeFilter)

    if (statusFilter)
      filtered = filtered.filter((r) =>
        statusFilter === 'passed' ? r.passed : !r.passed
      )

    return filtered
  }, [results, studentNameFilter, topicFilter, levelFilter, questionTypeFilter, statusFilter])

  const handleResetFilters = () => {
    setStudentNameFilter('')
    setTopicFilter('')
    setLevelFilter('')
    setQuestionTypeFilter('')
    setStatusFilter('')
  }

  const hasActiveFilters =
    studentNameFilter || topicFilter || levelFilter || questionTypeFilter || statusFilter

  const handleExportCSV = () => {
    const headers = ['Аты-жөні', 'Тақырып', 'Деңгей', 'Тапсырма түрі', 'Әрекет', 'Нәтиже', 'Мәртебе']
    const rows = filteredResults.map((r) => [
      r.studentName,
      r.topicName,
      r.testLevel,
      QUESTION_TYPE_LABELS[r.questionType || 'multipleChoice'] || r.questionType,
      r.attemptNumber,
      `${r.score}/${r.totalQuestions} (${r.percentage}%)`,
      r.passed ? 'Өтті' : 'Өтпеген',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `results_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
        📊 Тест нәтижелері
      </h1>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🔍 Фильтрлер</h2>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition"
            >
              ✕ Тазалау
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {/* ФИО */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Оқушының аты-жөні</label>
            <input
              type="text"
              placeholder="Іздеу..."
              value={studentNameFilter}
              onChange={(e) => setStudentNameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Тема */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Тақырып</label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Барлық тақырыптар</option>
              {uniqueTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Тип задания */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Тапсырма түрі</label>
            <select
              value={questionTypeFilter}
              onChange={(e) => setQuestionTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Барлық түрлер</option>
              {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Уровень */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Деңгей</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Барлық деңгейлер</option>
              <option value="A">A Деңгейі</option>
              <option value="B">B Деңгейі</option>
              <option value="C">C Деңгейі</option>
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Мәртебе</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Барлығы</option>
              <option value="passed">✅ Өтті</option>
              <option value="failed">❌ Өтпеген</option>
            </select>
          </div>

          {/* Экспорт */}
          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm"
            >
              📥 CSV экспорты
            </button>
          </div>
        </div>

        {/* Счётчик */}
        <p className="text-xs text-gray-500 mt-2">
          Көрсетілуде: <span className="font-semibold text-gray-700">{filteredResults.length}</span> / {results.length} жазба
          {hasActiveFilters && <span className="ml-2 text-blue-500">(фильтр қолданылды)</span>}
        </p>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 overflow-x-auto">
        <ResultsTable results={filteredResults} />
      </div>
    </div>
  )
}