'use client'

import { Question, QuestionOption } from '@/types'

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
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
      {/* Текст вопроса */}
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 break-words">
        {question.text}
      </h3>

      {/* Варианты ответов */}
      <div className="space-y-2 md:space-y-3">
        {question.options.map((option: QuestionOption) => (
          <label
            key={option.id}
            className="flex items-start md:items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 active:border-blue-600 transition"
          >
            <input
              type="checkbox"
              checked={selectedOptionIds.includes(option.id)}
              onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0 mt-1 md:mt-0"
            />
            <span className="ml-3 text-sm md:text-base text-gray-800 break-words">
              {option.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}