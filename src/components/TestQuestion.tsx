'use client'

import { Question, QuestionOption } from '@/types'
import { useState } from 'react'

interface TestQuestionProps {
  question: Question
  onAnswerSelect: (selectedOptionIds: string[]) => void
  selectedOptionIds: string[]
}

export default function TestQuestion({
  question,
  onAnswerSelect,
  selectedOptionIds,
}: TestQuestionProps) {
  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      onAnswerSelect([...selectedOptionIds, optionId])
    } else {
      onAnswerSelect(selectedOptionIds.filter((id) => id !== optionId))
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      {/* Текст вопроса */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {question.text}
      </h3>

      {/* Варианты ответов */}
      <div className="space-y-3">
        {question.options.map((option: QuestionOption) => (
          <label
            key={option.id}
            className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
          >
            <input
              type="checkbox"
              checked={selectedOptionIds.includes(option.id)}
              onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-800">{option.text}</span>
          </label>
        ))}
      </div>

      {/* Объяснение (если есть) */}
      {question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 text-sm rounded">
          <strong>Справка:</strong> {question.explanation}
        </div>
      )}
    </div>
  )
}