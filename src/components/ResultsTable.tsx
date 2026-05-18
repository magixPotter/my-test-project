'use client'

import { TestResult } from '@/types'

const QUESTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  multipleChoice: { label: '☑️ Тест',         color: 'bg-blue-100 text-blue-800' },
  freeText:       { label: '✍️ Ашық жауап',    color: 'bg-green-100 text-green-800' },
  matching:       { label: '🔗 Сәйкестендіру', color: 'bg-purple-100 text-purple-800' },
  fillInTheBlank: { label: '📝 Пропуск',       color: 'bg-orange-100 text-orange-800' },
}

interface ResultsTableProps {
  results: (TestResult & { topicName?: string })[]
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm">Нәтижелер табылмады</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Аты-жөні</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Тақырып</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Деңгей</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Тапсырма түрі</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Әрекет</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Нәтиже</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Мәртебе</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((result, idx) => {
            const qType = result.questionType || 'multipleChoice'
            const typeInfo = QUESTION_TYPE_LABELS[qType] || { label: qType, color: 'bg-gray-100 text-gray-700' }

            return (
              <tr key={result.id} className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-3 py-3 text-sm font-medium text-gray-900 break-words max-w-[160px]">
                  {result.studentName}
                </td>
                <td className="px-3 py-3 text-sm text-gray-700 break-words max-w-[180px]">
                  {result.topicName || result.topicId}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold text-xs">
                    {result.testLevel}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-sm text-gray-700">
                  {result.attemptNumber}
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className="font-semibold text-gray-900">{result.score}/{result.totalQuestions}</span>
                  <span className="text-gray-500 text-xs ml-1">({result.percentage}%)</span>
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  {result.passed ? (
                    <span className="inline-block bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                      ✅ Өтті
                    </span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                      ❌ Өтпеген
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}