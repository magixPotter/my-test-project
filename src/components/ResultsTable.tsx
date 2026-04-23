'use client'

import { TestResult } from '@/types'
import { formatDate } from '@/lib/utils'

interface ResultsTableProps {
  results: (TestResult & { topicName?: string })[]
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нәтижелер табылмады
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm md:text-base">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">ФИО</th>
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">Тема</th>
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">
              Деңгей
            </th>
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">
              Әрекет
            </th>
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">
              Нәтижесі
            </th>
            <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">
              Мәртебесі
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm break-words">
                {result.studentName}
              </td>
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm break-words">
                {result.topicName || result.topicId}
              </td>
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">
                <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold text-xs">
                  {result.testLevel}
                </span>
              </td>
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">
                {result.attemptNumber}
              </td>
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center font-semibold text-xs md:text-sm">
                {result.score}/{result.totalQuestions} ({result.percentage}%)
              </td>
              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center">
                {result.passed ? (
                  <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                    ✅ Өтті
                  </span>
                ) : (
                  <span className="inline-block bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    ❌ Өтпеген
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}