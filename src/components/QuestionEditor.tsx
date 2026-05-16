'use client'

import { useState } from 'react'
import { QuestionType, Question, MatchingItem } from '@/types'
import Image from 'next/image'

interface QuestionEditorProps {
  testId: string
  question?: Question | null
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const MATCHING_COLORS = [
  'bg-red-100 border-red-400',
  'bg-blue-100 border-blue-400',
  'bg-green-100 border-green-400',
  'bg-yellow-100 border-yellow-400',
  'bg-purple-100 border-purple-400',
  'bg-pink-100 border-pink-400',
  'bg-indigo-100 border-indigo-400',
  'bg-cyan-100 border-cyan-400',
  'bg-orange-100 border-orange-400',
  'bg-lime-100 border-lime-400',
]

export default function QuestionEditor({
  testId,
  question,
  onSave,
  onCancel,
  isSubmitting,
}: QuestionEditorProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.type || 'multipleChoice'
  )
  const [questionText, setQuestionText] = useState(question?.text || '')
  const [instruction, setInstruction] = useState(question?.instruction || '')
  const [explanation, setExplanation] = useState(question?.explanation || '')

  // Type 1: Multiple Choice
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >(
    question && question.type === 'multipleChoice'
      ? (question.options as any)
      : [
          { id: 'opt_0', text: '', isCorrect: false },
          { id: 'opt_1', text: '', isCorrect: false },
        ]
  )

  // Type 2: Free Text
  const [freeTextVariations, setFreeTextVariations] = useState<string[]>(
    question && question.type === 'freeText'
      ? (question.options as any)[0]?.variations || ['']
      : ['']
  )

  // Type 3: Matching
  const [matchingPairs, setMatchingPairs] = useState<
    Array<{
      id: string
      left: MatchingItem
      right: MatchingItem
      pairIndex: number
    }>
  >(
    question && question.type === 'matching'
      ? (question.options as any)[0]?.pairs || []
      : []
  )
  const [displayPairCount, setDisplayPairCount] = useState(
    question && question.type === 'matching'
      ? (question.options as any)[0]?.displayPairCount || 5
      : 5
  )

  // Type 4: Fill in the Blank
  const [fillInBlankFullText, setFillInBlankFullText] = useState(
    question && question.type === 'fillInTheBlank'
      ? (question.options as any)[0]?.fullText || ''
      : ''
  )
  const [fillInBlankVariations, setFillInBlankVariations] = useState<string[]>(
    question && question.type === 'fillInTheBlank'
      ? (question.options as any)[0]?.variations || ['']
      : ['']
  )

  // Handlers for Type 1
  const addMultipleChoiceOption = () => {
    setMultipleChoiceOptions([
      ...multipleChoiceOptions,
      { id: `opt_${Date.now()}`, text: '', isCorrect: false },
    ])
  }

  const removeMultipleChoiceOption = (id: string) => {
    if (multipleChoiceOptions.length > 2) {
      setMultipleChoiceOptions(
        multipleChoiceOptions.filter((opt) => opt.id !== id)
      )
    }
  }

  const updateMultipleChoiceOption = (
    id: string,
    field: string,
    value: any
  ) => {
    setMultipleChoiceOptions(
      multipleChoiceOptions.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    )
  }

  // Handlers for Type 2 & 4
  const addVariation = (type: 'freeText' | 'fillInBlank') => {
    if (type === 'freeText') {
      setFreeTextVariations([...freeTextVariations, ''])
    } else {
      setFillInBlankVariations([...fillInBlankVariations, ''])
    }
  }

  const removeVariation = (index: number, type: 'freeText' | 'fillInBlank') => {
    if (type === 'freeText') {
      if (freeTextVariations.length > 1) {
        setFreeTextVariations(freeTextVariations.filter((_, i) => i !== index))
      }
    } else {
      if (fillInBlankVariations.length > 1) {
        setFillInBlankVariations(
          fillInBlankVariations.filter((_, i) => i !== index)
        )
      }
    }
  }

  const updateVariation = (
    index: number,
    value: string,
    type: 'freeText' | 'fillInBlank'
  ) => {
    if (type === 'freeText') {
      const newVariations = [...freeTextVariations]
      newVariations[index] = value
      setFreeTextVariations(newVariations)
    } else {
      const newVariations = [...fillInBlankVariations]
      newVariations[index] = value
      setFillInBlankVariations(newVariations)
    }
  }

  // Handlers for Type 3: Matching
  const addMatchingPair = () => {
    const newPair = {
      id: `pair_${Date.now()}`,
      left: { id: `left_${Date.now()}`, content: '', type: 'text' as const },
      right: { id: `right_${Date.now()}`, content: '', type: 'text' as const },
      pairIndex: matchingPairs.length,
    }
    setMatchingPairs([...matchingPairs, newPair])
  }

  const removeMatchingPair = (id: string) => {
    const filtered = matchingPairs.filter((p) => p.id !== id)
    // Пересчитать индексы
    setMatchingPairs(
      filtered.map((p, idx) => ({
        ...p,
        pairIndex: idx,
      }))
    )
  }

  const updateMatchingPairItem = (
    pairId: string,
    side: 'left' | 'right',
    field: string,
    value: any
  ) => {
    setMatchingPairs(
      matchingPairs.map((p) => {
        if (p.id === pairId) {
          return {
            ...p,
            [side]: { ...p[side], [field]: value },
          }
        }
        return p
      })
    )
  }

  const handleImageUpload = (
    pairId: string,
    side: 'left' | 'right',
    file: File
  ) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      updateMatchingPairItem(pairId, side, 'content', base64)
      updateMatchingPairItem(pairId, side, 'type', 'image')
    }
    reader.readAsDataURL(file)
  }

  // Validation and Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!questionText.trim()) {
      alert('Сұрақ мәтінін енгізіңіз')
      return
    }

    let options: any = []

    if (questionType === 'multipleChoice') {
      const filledOptions = multipleChoiceOptions.filter((opt) =>
        opt.text.trim()
      )
      if (filledOptions.length < 2) {
        alert('Кем дегенде 2 жауап нұсқасы қажет')
        return
      }
      if (!filledOptions.some((opt) => opt.isCorrect)) {
        alert('Дұрыс жауапты белгілеңіз')
        return
      }
      options = filledOptions
    } else if (questionType === 'freeText') {
      const filledVariations = freeTextVariations.filter((v) => v.trim())
      if (filledVariations.length === 0) {
        alert('Кем дегенде бір вариация қажет')
        return
      }
      options = [{ id: 'opt_0', variations: filledVariations }]
    } else if (questionType === 'matching') {
      if (matchingPairs.length === 0) {
        alert('Кем дегенде бір пара қажет')
        return
      }
      if (displayPairCount > matchingPairs.length) {
        alert(
          `Өндіктеу: ${matchingPairs.length} парадан көбі таңдай алмайсыз`
        )
        return
      }
      options = [
        {
          id: 'opt_0',
          pairs: matchingPairs,
          displayPairCount,
        },
      ]
    } else if (questionType === 'fillInTheBlank') {
      if (!fillInBlankFullText.includes('___')) {
        alert('Мәтінде ___ маркерін қойыңыз')
        return
      }
      const filledVariations = fillInBlankVariations.filter((v) => v.trim())
      if (filledVariations.length === 0) {
        alert('Кем дегенде бір вариация қажет')
        return
      }
      options = [
        {
          id: 'opt_0',
          fullText: fillInBlankFullText,
          variations: filledVariations,
        },
      ]
    }

    try {
      const payload: any = {
        testId,
        text: questionText,
        options,
        explanation,
        instruction,
        type: questionType,
      }

      if (question?.id) {
        payload.id = question.id
      }

      await onSave(payload)
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Сұрақты сақтау кезінде қате')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          {question ? 'Сұрақты өңдеу' : 'Сұрақ қосу'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Тип вопроса */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Сұрақ түрі *
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              disabled={!!question} // Нельзя менять тип существующего вопроса
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            >
              <option value="multipleChoice">
                1) Бірнеше нұсқалы сұрақ
              </option>
              <option value="freeText">2) Ашық жауап</option>
              <option value="matching">3) Сәйкестендіру</option>
              <option value="fillInTheBlank">4) Пропускты толтыру</option>
            </select>
          </div>

          {/* Текст вопроса */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Сұрақ мәтіні / Инструкция *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder="мысалы: 'Дұрыс жауапты таңдаңыз' немесе 'Теңдеуді шешіңіз: 2x + 3 = 7'"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Мини-инструкция для ученика */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Оқушы үшін мини-инструкция (міндетті емес)
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="мысалы: 'Пропущенный сөзді енгізіңіз' немесе 'Дұрыс пара таңдаңыз'"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* TYPE 1: MULTIPLE CHOICE */}
          {questionType === 'multipleChoice' && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-4">
                Жауап нұсқалары *
              </label>
              <div className="space-y-3">
                {multipleChoiceOptions.map((option) => (
                  <div key={option.id} className="flex gap-2 items-start">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) =>
                        updateMultipleChoiceOption(
                          option.id,
                          'isCorrect',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 mt-2"
                      title="Дұрыс жауапты белгілеңіз"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateMultipleChoiceOption(option.id, 'text', e.target.value)
                      }
                      placeholder="Жауап варианты"
                      className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                    />
                    {multipleChoiceOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMultipleChoiceOption(option.id)}
                        className="px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMultipleChoiceOption}
                className="mt-3 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm md:text-base transition"
              >
                + Вариант қосу
              </button>
            </div>
          )}

          {/* TYPE 2: FREE TEXT */}
          {questionType === 'freeText' && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-4">
                Жауапты нормаль варияциялары * (регистр салмасы)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                💡 Мысалы: "Солнце", "солнце", "СОЛНЦЕ", "звезда солнце"
              </p>
              <div className="space-y-3">
                {freeTextVariations.map((variation, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={variation}
                      onChange={(e) =>
                        updateVariation(idx, e.target.value, 'freeText')
                      }
                      placeholder={`Вариация ${idx + 1}`}
                      className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                    />
                    {freeTextVariations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariation(idx, 'freeText')}
                        className="px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addVariation('freeText')}
                className="mt-3 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm md:text-base transition"
              >
                + Вариация қосу
              </button>
            </div>
          )}

          {/* TYPE 3: MATCHING */}
          {questionType === 'matching' && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Ұсынылмасы үшін пара санын таңдаңыз *
                </label>
                <input
                  type="number"
                  min="1"
                  value={displayPairCount}
                  onChange={(e) => setDisplayPairCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Барлық пара: {matchingPairs.length}
                </p>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-4">
                  Сәйкестендіру пары *
                </label>
                <div className="space-y-4">
                  {matchingPairs.map((pair, idx) => (
                    <div
                      key={pair.id}
                      className={`p-3 md:p-4 rounded border-2 ${
                        MATCHING_COLORS[idx % MATCHING_COLORS.length]
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs md:text-sm font-semibold text-gray-700">
                          Пара {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMatchingPair(pair.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
                        >
                          ✕ Жою
                        </button>
                      </div>

                      {/* Левая часть */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Сол жақ *
                          </label>
                          <select
                            value={pair.left.type}
                            onChange={(e) =>
                              updateMatchingPairItem(
                                pair.id,
                                'left',
                                'type',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="text">Мәтін</option>
                            <option value="image">Сура</option>
                          </select>
                        </div>

                        {pair.left.type === 'text' ? (
                          <input
                            type="text"
                            value={pair.left.content}
                            onChange={(e) =>
                              updateMatchingPairItem(
                                pair.id,
                                'left',
                                'content',
                                e.target.value
                              )
                            }
                            placeholder="Мәтін енгізіңіз"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(pair.id, 'left', e.target.files[0])
                                }
                              }}
                              className="flex-1 text-xs"
                            />
                            {pair.left.content && pair.left.type === 'image' && (
                              <div className="relative w-12 h-12">
                                <Image
                                  src={pair.left.content}
                                  alt="left"
                                  fill
                                  className="object-contain"
                                  sizes="50px"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Правая часть */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Оң жақ *
                          </label>
                          <select
                            value={pair.right.type}
                            onChange={(e) =>
                              updateMatchingPairItem(
                                pair.id,
                                'right',
                                'type',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="text">Мәтін</option>
                            <option value="image">Сура</option>
                          </select>
                        </div>

                        {pair.right.type === 'text' ? (
                          <input
                            type="text"
                            value={pair.right.content}
                            onChange={(e) =>
                              updateMatchingPairItem(
                                pair.id,
                                'right',
                                'content',
                                e.target.value
                              )
                            }
                            placeholder="Мәтін енгізіңіз"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(pair.id, 'right', e.target.files[0])
                                }
                              }}
                              className="flex-1 text-xs"
                            />
                            {pair.right.content && pair.right.type === 'image' && (
                              <div className="relative w-12 h-12">
                                <Image
                                  src={pair.right.content}
                                  alt="right"
                                  fill
                                  className="object-contain"
                                  sizes="50px"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMatchingPair}
                  className="mt-4 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm md:text-base transition"
                >
                  + Пара қосу
                </button>
              </div>
            </div>
          )}

          {/* TYPE 4: FILL IN THE BLANK */}
          {questionType === 'fillInTheBlank' && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Толық мәтін (пропускту ___ деп белгілеңіз) *
                </label>
                <textarea
                  value={fillInBlankFullText}
                  onChange={(e) => setFillInBlankFullText(e.target.value)}
                  rows={3}
                  placeholder="мысалы: 'Күнді болып саналатын солнце өтінеміз сәл көрсетеді. Солнце жүрегінің негіз ___'"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {fillInBlankFullText.includes('___')
                    ? '✓ Пропуск белгісі табылды'
                    : '✗ ___ белгісін қойыңыз'}
                </p>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-4">
                  Жауапты нормаль варияциялары * (регистр салмасы)
                </label>
                <div className="space-y-3">
                  {fillInBlankVariations.map((variation, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={variation}
                        onChange={(e) =>
                          updateVariation(idx, e.target.value, 'fillInBlank')
                        }
                        placeholder={`Вариация ${idx + 1}`}
                        className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                      />
                      {fillInBlankVariations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariation(idx, 'fillInBlank')}
                          className="px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addVariation('fillInBlank')}
                  className="mt-3 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm md:text-base transition"
                >
                  + Вариация қосу
                </button>
              </div>
            </div>
          )}

          {/* Объяснение */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Түсініктеме (міндетті емес)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 md:gap-4 justify-end flex-col-reverse md:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded transition disabled:opacity-50 text-sm md:text-base"
            >
              Бас тарту
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition disabled:opacity-50 text-sm md:text-base"
            >
              {isSubmitting ? 'Сақталуда...' : question ? 'Жаңарту' : 'Қосу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}