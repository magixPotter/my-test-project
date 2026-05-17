'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Question, QuestionOption, FreeTextOption, MatchingOption, FillInTheBlankOption } from '@/types'

interface TestQuestionProps {
  question: Question
  onAnswerSelect: (answer: any) => void
  selectedAnswer?: any
}

const MATCHING_COLORS = [
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', ring: 'ring-red-400' },
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', ring: 'ring-blue-400' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', ring: 'ring-green-400' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', ring: 'ring-yellow-400' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', ring: 'ring-purple-400' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700', ring: 'ring-pink-400' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', ring: 'ring-indigo-400' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700', ring: 'ring-cyan-400' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', ring: 'ring-orange-400' },
  { bg: 'bg-lime-100', border: 'border-lime-400', text: 'text-lime-700', ring: 'ring-lime-400' },
]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─────────────────────────────────────────────
// Matching — отдельный компонент чтобы хуки были всегда
// ─────────────────────────────────────────────
function MatchingQuestion({ question, onAnswerSelect, selectedAnswer }: TestQuestionProps) {
  const options = question.options as MatchingOption[]
  const allPairs = options?.[0]?.pairs || []
  const displayPairCount = options?.[0]?.displayPairCount || allPairs.length

  // Рандомно выбрать displayPairCount пар из банка (фиксируется при первом рендере)
  const displayedPairs = useMemo(() => {
    return shuffleArray(allPairs).slice(0, displayPairCount)
  }, [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Перемешать обе колонки независимо
  const shuffledLeft = useMemo(() => shuffleArray(displayedPairs), [displayedPairs])
  const shuffledRight = useMemo(() => shuffleArray(displayedPairs), [displayedPairs])

  // selectedAnswer = { [leftId]: rightId } — объект соответствий
  const userMatches: Record<string, string> = selectedAnswer || {}

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)

  // Получить цвет по индексу пары в оригинальном массиве
  const getPairColor = (leftId: string) => {
    const idx = displayedPairs.findIndex((p) => p.left.id === leftId)
    return MATCHING_COLORS[idx % MATCHING_COLORS.length]
  }

  const handleLeftClick = (leftId: string) => {
    // Если уже есть соответствие — снять его
    if (userMatches[leftId]) {
      const newMatches = { ...userMatches }
      delete newMatches[leftId]
      onAnswerSelect(newMatches)
      setSelectedLeftId(null)
      return
    }
    setSelectedLeftId((prev) => (prev === leftId ? null : leftId))
  }

  const handleRightClick = (rightId: string) => {
    if (!selectedLeftId) return

    // Если этот правый уже занят другим левым — убрать старую связь
    const newMatches = { ...userMatches }
    const existingLeft = Object.keys(newMatches).find((k) => newMatches[k] === rightId)
    if (existingLeft) delete newMatches[existingLeft]

    newMatches[selectedLeftId] = rightId
    onAnswerSelect(newMatches)
    setSelectedLeftId(null)
  }

  const removeMatch = (leftId: string) => {
    const newMatches = { ...userMatches }
    delete newMatches[leftId]
    onAnswerSelect(newMatches)
    setSelectedLeftId(null)
  }

  const matchedCount = Object.keys(userMatches).length
  const totalCount = displayedPairs.length

  if (!options || options.length === 0) {
    return <div className="bg-white rounded-lg p-4 text-red-600">Қате: параметрлер табылмады</div>
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
        {question.text}
      </h3>
      {question.instruction && (
        <p className="text-xs md:text-sm text-gray-600 mb-4 italic">💡 {question.instruction}</p>
      )}

      {/* Прогресс */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(matchedCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-600">{matchedCount}/{totalCount}</span>
      </div>

      {/* Подсказка */}
      {selectedLeftId ? (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          👆 Оң жақтан сәйкес элементті таңдаңыз немесе{' '}
          <button type="button" onClick={() => setSelectedLeftId(null)} className="underline font-semibold">
            бас тартыңыз
          </button>
        </div>
      ) : (
        <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          👈 Сол жақтан элемент таңдаңыз
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {/* Левая колонка */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 text-center mb-2 uppercase tracking-wide">Сол жақ</p>
          {shuffledLeft.map((pair) => {
            const leftId = pair.left.id
            const isMatched = !!userMatches[leftId]
            const isSelected = selectedLeftId === leftId
            const color = isMatched ? getPairColor(leftId) : null

            return (
              <button
                key={leftId}
                type="button"
                onClick={() => handleLeftClick(leftId)}
                className={`w-full p-2 md:p-3 rounded-lg border-2 transition text-left min-h-[60px] ${
                  isMatched && color
                    ? `${color.bg} ${color.border}`
                    : isSelected
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <MatchingItemContent item={pair.left} />
                {isMatched && (
                  <span className="block text-xs mt-1 text-gray-500 font-medium">✓ таңдалды</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Правая колонка */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 text-center mb-2 uppercase tracking-wide">Оң жақ</p>
          {shuffledRight.map((pair) => {
            const rightId = pair.right.id
            // Найти: связан ли этот правый с каким-то левым
            const linkedLeftId = Object.keys(userMatches).find((k) => userMatches[k] === rightId)
            const isMatched = !!linkedLeftId
            const color = isMatched && linkedLeftId ? getPairColor(linkedLeftId) : null
            const isClickable = !!selectedLeftId && !isMatched

            return (
              <button
                key={rightId}
                type="button"
                onClick={() => {
                  if (isMatched && linkedLeftId) {
                    removeMatch(linkedLeftId)
                  } else if (selectedLeftId) {
                    handleRightClick(rightId)
                  }
                }}
                className={`w-full p-2 md:p-3 rounded-lg border-2 transition text-left min-h-[60px] ${
                  isMatched && color
                    ? `${color.bg} ${color.border}`
                    : isClickable
                    ? 'bg-yellow-50 border-yellow-400 hover:bg-yellow-100 cursor-pointer'
                    : selectedLeftId
                    ? 'bg-gray-50 border-gray-300 opacity-60'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <MatchingItemContent item={pair.right} />
                {isMatched && (
                  <span className="block text-xs mt-1 text-gray-500 font-medium">✓ таңдалды</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Выбранные пары */}
      {matchedCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-semibold text-green-700 mb-2">✓ Таңдалған жұптар:</p>
          <div className="space-y-1.5">
            {Object.entries(userMatches).map(([leftId, rightId]) => {
              const leftPair = displayedPairs.find((p) => p.left.id === leftId)
              const rightPair = displayedPairs.find((p) => p.right.id === rightId)
              const color = getPairColor(leftId)
              if (!leftPair || !rightPair) return null
              return (
                <div key={leftId} className={`flex items-center gap-2 p-2 rounded-lg border ${color.border} ${color.bg}`}>
                  <span className="text-xs text-gray-700 flex-1 truncate">
                    {leftPair.left.type === 'text' ? leftPair.left.content : '[Сурет]'}
                  </span>
                  <span className="text-gray-400 text-xs">↔</span>
                  <span className="text-xs text-gray-700 flex-1 truncate text-right">
                    {rightPair.right.type === 'text' ? rightPair.right.content : '[Сурет]'}
                  </span>
                  <button type="button" onClick={() => removeMatch(leftId)} className="text-red-500 hover:text-red-700 text-xs ml-1 flex-shrink-0">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchingItemContent({ item }: { item: { type: 'text' | 'image'; content: string } }) {
  if (item.type === 'image' && item.content) {
    return (
      <div className="relative w-full h-20 md:h-24 bg-gray-100 rounded overflow-hidden">
        <Image
          src={item.content}
          alt="matching"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 140px, 180px"
        />
      </div>
    )
  }
  return (
    <p className="text-xs md:text-sm text-gray-900 break-words font-medium leading-snug">
      {item.content}
    </p>
  )
}

// ─────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────
export default function TestQuestion({ question, onAnswerSelect, selectedAnswer }: TestQuestionProps) {
  // TYPE 1: Multiple Choice
  if (question.type === 'multipleChoice') {
    const options = question.options as QuestionOption[]
    const selectedOptionIds: string[] = selectedAnswer || []

    const handleOptionChange = (optionId: string, checked: boolean) => {
      if (checked) {
        onAnswerSelect([...selectedOptionIds, optionId])
      } else {
        onAnswerSelect(selectedOptionIds.filter((id) => id !== optionId))
      }
    }

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">💡 {question.instruction}</p>
        )}
        <div className="space-y-2 md:space-y-3">
          {options.map((option) => (
            <label
              key={option.id}
              className={`flex items-start md:items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                selectedOptionIds.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedOptionIds.includes(option.id)}
                onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded flex-shrink-0 mt-1 md:mt-0 accent-blue-600"
              />
              <span className="ml-3 text-sm md:text-base text-gray-800 break-words">{option.text}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  // TYPE 2: Free Text
  if (question.type === 'freeText') {
    const userAnswer = selectedAnswer || ''
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">💡 {question.instruction}</p>
        )}
        <textarea
          value={userAnswer}
          onChange={(e) => onAnswerSelect(e.target.value)}
          placeholder="Өз жауабыңызды енгізіңіз..."
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
          rows={4}
        />
        <p className="text-xs text-gray-400 mt-2">💡 Регистр және шеттегі бос орындар ескерілмейді</p>
      </div>
    )
  }

  // TYPE 3: Matching — отдельный компонент (хуки всегда вызываются)
  if (question.type === 'matching') {
    return (
      <MatchingQuestion
        question={question}
        onAnswerSelect={onAnswerSelect}
        selectedAnswer={selectedAnswer}
      />
    )
  }

  // TYPE 4: Fill in the Blank
  if (question.type === 'fillInTheBlank') {
    const options = question.options as FillInTheBlankOption[]
    if (!options || options.length === 0) {
      return <div className="bg-white rounded-lg p-4 text-red-600">Қате: параметрлер табылмады</div>
    }
    const fullText = options[0].fullText || ''
    const userAnswer = selectedAnswer || ''
    const parts = fullText.split('___')

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">💡 {question.instruction}</p>
        )}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm md:text-base text-gray-900 leading-relaxed">
          <span>{parts[0]}</span>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => onAnswerSelect(e.target.value)}
            placeholder="жауап"
            className="mx-2 px-3 py-1 border-b-2 border-blue-500 bg-transparent text-blue-700 font-semibold focus:outline-none focus:border-blue-700 transition"
            style={{ minWidth: Math.max(80, userAnswer.length * 9 + 24) + 'px' }}
          />
          <span>{parts[1]}</span>
        </div>
        <p className="text-xs text-gray-400">💡 Регистр және шеттегі бос орындар ескерілмейді</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 text-red-600 font-semibold">
      Белгісіз сұрақ түрі: {question.type}
    </div>
  )
}