'use client'

import { TestResult } from '@/types'
import { formatDate } from '@/lib/utils'

interface ResultsTableProps {
  results: TestResult[]
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Результаты не найдены
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2 text-left">ФИО</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Тема</th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Уровень
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Попытка
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Результат
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Статус
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">Дата</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">
                {result.studentName}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {result.topicId}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold">
                  {result.testLevel}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {result.attemptNumber}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                {result.score}/{result.totalQuestions} ({result.percentage}%)
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {result.passed ? (
                  <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                    ✅ Пройден
                  </span>
                ) : (
                  <span className="inline-block bg-red-200 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                    ❌ Не пройден
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                {formatDate(result.completedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}