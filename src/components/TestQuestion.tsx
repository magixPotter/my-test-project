'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Question, QuestionOption, FreeTextOption, MatchingOption, FillInTheBlankOption } from '@/types'

interface TestQuestionProps {
  question: Question
  onAnswerSelect: (answer: any) => void
  selectedAnswer?: any
}

const MATCHING_COLORS = [
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' },
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
  { bg: 'bg-lime-100', border: 'border-lime-400', text: 'text-lime-700' },
]

export default function TestQuestion({
  question,
  onAnswerSelect,
  selectedAnswer,
}: TestQuestionProps) {
  const [shuffledRightItems, setShuffledRightItems] = useState<any[]>([])
  const [matchingState, setMatchingState] = useState<{
    selectedLeftId: string | null
    selectedRightId: string | null
  }>({ selectedLeftId: null, selectedRightId: null })

  // ===== TYPE 1: Multiple Choice =====
  if (question.type === 'multipleChoice') {
    const options = question.options as QuestionOption[]
    const selectedOptionIds = selectedAnswer || []

    const handleOptionChange = (optionId: string, checked: boolean) => {
      if (checked) {
        onAnswerSelect([...selectedOptionIds, optionId])
      } else {
        onAnswerSelect(selectedOptionIds.filter((id: string) => id !== optionId))
      }
    }

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">
            💡 {question.instruction}
          </p>
        )}

        <div className="space-y-2 md:space-y-3">
          {options.map((option: QuestionOption) => (
            <label
              key={option.id}
              className="flex items-start md:items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
            >
              <input
                type="checkbox"
                checked={selectedOptionIds.includes(option.id)}
                onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded flex-shrink-0 mt-1 md:mt-0"
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

  // ===== TYPE 2: Free Text Answer =====
  if (question.type === 'freeText') {
    const userAnswer = selectedAnswer || ''

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">
            💡 {question.instruction}
          </p>
        )}

        <textarea
          value={userAnswer}
          onChange={(e) => onAnswerSelect(e.target.value)}
          placeholder="Өз жауабыңызды енгізіңіз..."
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm md:text-base"
          rows={4}
        />

        <p className="text-xs md:text-sm text-gray-500 mt-2">
          💡 Регистр және пробелдар ескеріліп қаймайды
        </p>
      </div>
    )
  }

  // ===== TYPE 3: Matching =====
  if (question.type === 'matching') {
    const options = question.options as MatchingOption[]
    if (!options || options.length === 0) {
      return <div className="bg-white rounded-lg p-4 md:p-6 shadow-md text-red-600">Қате: параметрлер табылмады</div>
    }

    const allPairs = options[0].pairs || []
    const displayPairCount = options[0].displayPairCount || 5
    const displayedPairs = allPairs.slice(0, displayPairCount)

    // Инициализировать и перемешать правую колонку при первом рендере
    useEffect(() => {
      if (shuffledRightItems.length === 0 && displayedPairs.length > 0) {
        const rightItems = displayedPairs.map((p) => p.right)
        const shuffled = [...rightItems].sort(() => Math.random() - 0.5)
        setShuffledRightItems(shuffled)
      }
    }, [displayedPairs, shuffledRightItems.length])

    const userMatches = selectedAnswer || {}

    const handleLeftItemClick = (leftId: string) => {
      setMatchingState((prev) => ({
        ...prev,
        selectedLeftId: prev.selectedLeftId === leftId ? null : leftId,
      }))
    }

    const handleRightItemClick = (rightId: string) => {
      const selectedLeftId = matchingState.selectedLeftId
      if (!selectedLeftId) return

      // Если уже есть соответствие для этого левого элемента - заменить
      if (userMatches[selectedLeftId]) {
        const newMatches = { ...userMatches }
        delete newMatches[selectedLeftId]
        onAnswerSelect(newMatches)
      }

      // Добавить новое соответствие
      const newMatches = { ...userMatches, [selectedLeftId]: rightId }
      onAnswerSelect(newMatches)

      // Очистить выбор
      setMatchingState({ selectedLeftId: null, selectedRightId: null })
    }

    // Функция для отмены выбора пары
    const handleRemoveMatch = (leftId: string) => {
      const newMatches = { ...userMatches }
      delete newMatches[leftId]
      onAnswerSelect(newMatches)
    }

    // Функция для отмены выделения левого элемента если он уже выбран
    const handleRemoveLeftSelection = (leftId: string) => {
      if (matchingState.selectedLeftId === leftId) {
        setMatchingState({ selectedLeftId: null, selectedRightId: null })
      }
    }

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">
            💡 {question.instruction}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Левая колонка */}
          <div>
            <p className="font-semibold text-xs md:text-sm text-gray-700 mb-3 text-center">
              Сол жақ
            </p>
            <div className="space-y-2 md:space-y-3">
              {displayedPairs.map((pair, idx) => {
                const isMatched = userMatches[pair.left.id]
                const isSelected = matchingState.selectedLeftId === pair.left.id
                const matchedColor = MATCHING_COLORS[pair.pairIndex % MATCHING_COLORS.length]

                return (
                  <div key={pair.left.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMatched) {
                          handleRemoveMatch(pair.left.id)
                        } else {
                          handleLeftItemClick(pair.left.id)
                        }
                      }}
                      className={`w-full p-2 md:p-3 rounded border-2 transition text-left ${
                        isMatched
                          ? `${matchedColor.bg} ${matchedColor.border} border-2`
                          : isSelected
                            ? 'bg-blue-200 border-blue-500 border-2'
                            : 'bg-gray-50 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {pair.left.type === 'image' ? (
                        <div className="relative w-full h-20 md:h-24">
                          <Image
                            src={pair.left.content}
                            alt="matching-left"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 120px, 150px"
                          />
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-900 break-words font-medium">
                          {pair.left.content}
                        </p>
                      )}
                    </button>

                    {/* Показать соединение с правым элементом если совпадение выбрано */}
                    {isMatched && userMatches[pair.left.id] && (
                      <div className="text-center my-1">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${matchedColor.text}`}>
                          ✓ Выбрано
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Правая колонка */}
          <div>
            <p className="font-semibold text-xs md:text-sm text-gray-700 mb-3 text-center">
              Оң жақ
            </p>
            <div className="space-y-2 md:space-y-3">
              {shuffledRightItems.map((rightItem) => {
                // Найти левый элемент который соответствует этому правому
                const matchedPair = displayedPairs.find(
                  (p) => p.right.id === rightItem.id
                )
                const isMatched =
                  matchedPair && userMatches[matchedPair.left.id]
                const matchedColor = isMatched
                  ? MATCHING_COLORS[matchedPair!.pairIndex % MATCHING_COLORS.length]
                  : null

                return (
                  <button
                    key={rightItem.id}
                    type="button"
                    onClick={() => {
                      if (matchingState.selectedLeftId) {
                        handleRightItemClick(rightItem.id)
                      }
                    }}
                    disabled={!matchingState.selectedLeftId}
                    className={`w-full p-2 md:p-3 rounded border-2 transition text-left ${
                      isMatched && matchedColor
                        ? `${matchedColor.bg} ${matchedColor.border} border-2`
                        : matchingState.selectedLeftId &&
                            !matchingState.selectedLeftId.includes('left')
                          ? 'bg-yellow-50 border-yellow-400 cursor-pointer hover:bg-yellow-100'
                          : 'bg-gray-50 border-gray-300'
                    } ${!matchingState.selectedLeftId && !isMatched ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {rightItem.type === 'image' ? (
                      <div className="relative w-full h-20 md:h-24">
                        <Image
                          src={rightItem.content}
                          alt="matching-right"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 120px, 150px"
                        />
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm text-gray-900 break-words font-medium">
                        {rightItem.content}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Список выбранных пар */}
        {Object.keys(userMatches).length > 0 && (
          <div className="mt-6 p-3 md:p-4 bg-green-50 rounded border border-green-200">
            <p className="text-xs md:text-sm font-semibold text-green-700 mb-3">
              ✓ Выбранные пары ({Object.keys(userMatches).length}/{displayedPairs.length}):
            </p>
            <div className="space-y-2">
              {Object.entries(userMatches).map(([leftId, rightId]) => {
                const leftItem = displayedPairs.find((p) => p.left.id === leftId)?.left
                const rightItem = displayedPairs.find((p) => p.right.id === rightId)?.right
                const pairIndex = displayedPairs.findIndex((p) => p.left.id === leftId)
                const color = MATCHING_COLORS[pairIndex % MATCHING_COLORS.length]

                if (!leftItem || !rightItem) return null

                return (
                  <div
                    key={leftId}
                    className={`p-2 md:p-3 rounded flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 border ${color.border} ${color.bg}`}
                  >
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center text-xs md:text-sm text-gray-700 break-words">
                      <span className="font-semibold">
                        {leftItem.type === 'text' ? leftItem.content : '[Сура]'}
                      </span>
                      <span className="text-gray-500 hidden md:inline">↔</span>
                      <span className="font-semibold">
                        {rightItem.type === 'text' ? rightItem.content : '[Сура]'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMatch(leftId)}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs md:text-sm transition"
                    >
                      ✕ Өшіру
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {matchingState.selectedLeftId && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs md:text-sm text-blue-700">
              💡 Оң жақ пара таңдаңыз немесе <button
                type="button"
                onClick={() => setMatchingState({ selectedLeftId: null, selectedRightId: null })}
                className="underline font-semibold hover:text-blue-900"
              >
                таңдауды бас тартыңыз
              </button>
            </p>
          </div>
        )}
      </div>
    )
  }

  // ===== TYPE 4: Fill in the Blank =====
  if (question.type === 'fillInTheBlank') {
    const options = question.options as FillInTheBlankOption[]
    if (!options || options.length === 0) {
      return <div className="bg-white rounded-lg p-4 md:p-6 shadow-md text-red-600">Қате: параметрлер табылмады</div>
    }

    const fullText = options[0].fullText || ''
    const userAnswer = selectedAnswer || ''

    // Разделить текст на части (до пропуска и после)
    const parts = fullText.split('___')

    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 break-words">
          {question.text}
        </h3>
        {question.instruction && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">
            💡 {question.instruction}
          </p>
        )}

        <div className="mb-4">
          <div className="text-sm md:text-base text-gray-900 break-words leading-relaxed">
            <span>{parts[0]}</span>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => onAnswerSelect(e.target.value)}
              placeholder="Жауап"
              className="mx-1 px-2 py-1 border-2 border-blue-500 rounded text-blue-600 font-semibold text-sm md:text-base focus:outline-none focus:border-blue-700 transition"
              style={{
                minWidth: Math.max(100, userAnswer.length * 8 + 20) + 'px',
              }}
            />
            <span>{parts[1]}</span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-gray-500">
          💡 Регистр және пробелдар ескеріліп қаймайды
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
      <p className="text-red-600 font-semibold">Белгісіз сұрақ түрі: {question.type}</p>
    </div>
  )
}
