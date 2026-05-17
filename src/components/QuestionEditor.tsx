'use client'

import { useState } from 'react'
import { QuestionType, Question, MatchingItem } from '@/types'
import Image from 'next/image'


interface QuestionEditorProps {
  testId: string
  question?: Question | null
  forcedQuestionType?: QuestionType // Тип задания фиксируется из уровня теста
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multipleChoice: '1) Бірнеше нұсқалы сұрақ',
  freeText: '2) Ашық жауап',
  matching: '3) Сәйкестендіру',
  fillInTheBlank: '4) Пропускты толтыру',
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
  forcedQuestionType,
  onSave,
  onCancel,
  isSubmitting,
}: QuestionEditorProps) {
  // Тип всегда берётся из forcedQuestionType (из настроек уровня)
  // или из существующего вопроса при редактировании
  const resolvedType: QuestionType = forcedQuestionType || question?.type || 'multipleChoice'
  const questionType = resolvedType

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
    Array<{ id: string; left: MatchingItem; right: MatchingItem; pairIndex: number }>
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

  // ---- Handlers Type 1 ----
  const addMultipleChoiceOption = () => {
    setMultipleChoiceOptions([...multipleChoiceOptions, { id: `opt_${Date.now()}`, text: '', isCorrect: false }])
  }
  const removeMultipleChoiceOption = (id: string) => {
    if (multipleChoiceOptions.length > 2) {
      setMultipleChoiceOptions(multipleChoiceOptions.filter((o) => o.id !== id))
    }
  }
  const updateMultipleChoiceOption = (id: string, field: string, value: any) => {
    setMultipleChoiceOptions(multipleChoiceOptions.map((o) => (o.id === id ? { ...o, [field]: value } : o)))
  }

  // ---- Handlers Type 2 & 4 ----
  const addVariation = (type: 'freeText' | 'fillInBlank') => {
    if (type === 'freeText') setFreeTextVariations([...freeTextVariations, ''])
    else setFillInBlankVariations([...fillInBlankVariations, ''])
  }
  const removeVariation = (index: number, type: 'freeText' | 'fillInBlank') => {
    if (type === 'freeText' && freeTextVariations.length > 1) {
      setFreeTextVariations(freeTextVariations.filter((_, i) => i !== index))
    } else if (type === 'fillInBlank' && fillInBlankVariations.length > 1) {
      setFillInBlankVariations(fillInBlankVariations.filter((_, i) => i !== index))
    }
  }
  const updateVariation = (index: number, value: string, type: 'freeText' | 'fillInBlank') => {
    if (type === 'freeText') {
      const v = [...freeTextVariations]; v[index] = value; setFreeTextVariations(v)
    } else {
      const v = [...fillInBlankVariations]; v[index] = value; setFillInBlankVariations(v)
    }
  }

  // ---- Handlers Type 3: Matching ----
  const addMatchingPair = () => {
    const ts = Date.now()
    setMatchingPairs([
      ...matchingPairs,
      {
        id: `pair_${ts}`,
        left: { id: `left_${ts}`, content: '', type: 'text' },
        right: { id: `right_${ts}`, content: '', type: 'text' },
        pairIndex: matchingPairs.length,
      },
    ])
  }
  const removeMatchingPair = (id: string) => {
    const filtered = matchingPairs.filter((p) => p.id !== id)
    setMatchingPairs(filtered.map((p, idx) => ({ ...p, pairIndex: idx })))
  }
  const updateMatchingPairItem = (pairId: string, side: 'left' | 'right', field: string, value: any) => {
    setMatchingPairs(
      matchingPairs.map((p) => p.id === pairId ? { ...p, [side]: { ...p[side], [field]: value } } : p)
    )
  }
  const clearMatchingImage = (pairId: string, side: 'left' | 'right') => {
    updateMatchingPairItem(pairId, side, 'content', '')
    updateMatchingPairItem(pairId, side, 'type', 'text')
  }

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!questionText.trim()) {
      alert('Сұрақ мәтінін енгізіңіз')
      return
    }

    let options: any = []

    if (questionType === 'multipleChoice') {
      const filled = multipleChoiceOptions.filter((o) => o.text.trim())
      if (filled.length < 2) { alert('Кем дегенде 2 жауап нұсқасы қажет'); return }
      if (!filled.some((o) => o.isCorrect)) { alert('Дұрыс жауапты белгілеңіз'); return }
      options = filled
    } else if (questionType === 'freeText') {
      const filled = freeTextVariations.filter((v) => v.trim())
      if (filled.length === 0) { alert('Кем дегенде бір вариация қажет'); return }
      options = [{ id: 'opt_0', variations: filled }]
    } else if (questionType === 'matching') {
      if (matchingPairs.length === 0) { alert('Кем дегенде бір пара қажет'); return }
      // Проверить что все пары заполнены
      for (const pair of matchingPairs) {
        if (!pair.left.content.trim() || !pair.right.content.trim()) {
          alert('Барлық пара мазмұнын толтырыңыз'); return
        }
      }
      const safeCount = Math.min(displayPairCount, matchingPairs.length)
      options = [{ id: 'opt_0', pairs: matchingPairs, displayPairCount: safeCount }]
    } else if (questionType === 'fillInTheBlank') {
      if (!fillInBlankFullText.includes('___')) { alert('Мәтінде ___ маркерін қойыңыз'); return }
      const filled = fillInBlankVariations.filter((v) => v.trim())
      if (filled.length === 0) { alert('Кем дегенде бір вариация қажет'); return }
      options = [{ id: 'opt_0', fullText: fillInBlankFullText, variations: filled }]
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
      if (question?.id) payload.id = question.id
      await onSave(payload)
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Сұрақты сақтау кезінде қате')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 md:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {question ? 'Сұрақты өңдеу' : 'Сұрақ қосу'}
            </h2>
            <p className="text-sm text-blue-600 font-medium mt-1">
              Түр: {QUESTION_TYPE_LABELS[questionType]}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Текст вопроса */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              {questionType === 'matching' ? 'Инструкция (міндетті емес)' : 'Сұрақ мәтіні *'}
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder={
                questionType === 'fillInTheBlank'
                  ? 'мысалы: Төмендегі мәтіндегі пропускты толтырыңыз'
                  : questionType === 'matching'
                  ? 'мысалы: Сол жақ пен оң жақты сәйкестендіріңіз'
                  : 'мысалы: Дұрыс жауапты таңдаңыз'
              }
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Мини-инструкция */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Оқушы үшін мини-инструкция (міндетті емес)
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="мысалы: Тек бір дұрыс жауап бар"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* TYPE 1: MULTIPLE CHOICE */}
          {questionType === 'multipleChoice' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-xs md:text-sm font-semibold text-blue-800 mb-4">
                Жауап нұсқалары * (☑ дұрыс жауапты белгілеңіз)
              </label>
              <div className="space-y-3">
                {multipleChoiceOptions.map((option) => (
                  <div key={option.id} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => updateMultipleChoiceOption(option.id, 'isCorrect', e.target.checked)}
                      className="w-4 h-4 flex-shrink-0 accent-blue-600"
                      title="Дұрыс жауап"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateMultipleChoiceOption(option.id, 'text', e.target.value)}
                      placeholder="Жауап варианты"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none text-sm md:text-base ${option.isCorrect ? 'border-green-400 bg-green-50 focus:border-green-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {multipleChoiceOptions.length > 2 && (
                      <button type="button" onClick={() => removeMultipleChoiceOption(option.id)} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition flex-shrink-0">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMultipleChoiceOption} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition">
                + Вариант қосу
              </button>
            </div>
          )}

          {/* TYPE 2: FREE TEXT */}
          {questionType === 'freeText' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="block text-xs md:text-sm font-semibold text-green-800 mb-2">
                Дұрыс жауап вариациялары *
              </label>
              <p className="text-xs text-green-700 mb-4 bg-green-100 p-2 rounded">
                💡 Регистр және шеттегі бос орындар ескерілмейді. Мысалы: «Солнце», «солнце», «СОЛНЦЕ» — бәрі дұрыс деп саналады.
              </p>
              <div className="space-y-3">
                {freeTextVariations.map((variation, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={variation}
                      onChange={(e) => updateVariation(idx, e.target.value, 'freeText')}
                      placeholder={`Вариация ${idx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm md:text-base"
                    />
                    {freeTextVariations.length > 1 && (
                      <button type="button" onClick={() => removeVariation(idx, 'freeText')} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition flex-shrink-0">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addVariation('freeText')} className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition">
                + Вариация қосу
              </button>
            </div>
          )}

          {/* TYPE 3: MATCHING */}
          {questionType === 'matching' && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <label className="block text-xs md:text-sm font-semibold text-purple-800 mb-2">
                    Оқушыға көрсетілетін пара саны *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={matchingPairs.length || 1}
                    value={displayPairCount}
                    onChange={(e) => setDisplayPairCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, matchingPairs.length || 1)))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm md:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Банктегі барлық пара: {matchingPairs.length}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-purple-800 mb-3">
                  Пара банкі *
                </label>
                <div className="space-y-3">
                  {matchingPairs.map((pair, idx) => (
                    <div key={pair.id} className={`p-3 md:p-4 rounded-lg border-2 ${MATCHING_COLORS[idx % MATCHING_COLORS.length]}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs md:text-sm font-bold">Пара {idx + 1}</span>
                        <button type="button" onClick={() => removeMatchingPair(pair.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition">
                          ✕ Жою
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Левая сторона */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Сол жақ</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateMatchingPairItem(pair.id, 'left', 'type', pair.left.type === 'text' ? 'image' : 'text')}
                              className={`px-2 py-1 rounded text-xs font-medium transition flex-shrink-0 ${pair.left.type === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              {pair.left.type === 'image' ? '🖼 Сурет' : '📝 Мәтін'}
                            </button>
                          </div>
                          {pair.left.type === 'text' ? (
                            <input
                              type="text"
                              value={pair.left.content}
                              onChange={(e) => updateMatchingPairItem(pair.id, 'left', 'content', e.target.value)}
                              placeholder="Мәтін енгізіңіз"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                            />
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="url"
                                value={pair.left.content}
                                onChange={(e) => updateMatchingPairItem(pair.id, 'left', 'content', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-2 py-1.5 border border-purple-300 rounded text-sm focus:outline-none focus:border-purple-500 bg-white"
                              />
                              {pair.left.content && (
                                <div className="relative">
                                  <div className="relative w-full h-28 bg-gray-100 rounded overflow-hidden">
                                    <Image src={pair.left.content} alt="left" fill className="object-contain" sizes="200px"
                                      onError={() => updateMatchingPairItem(pair.id, 'left', 'content', '')}
                                    />
                                  </div>
                                  <button type="button" onClick={() => clearMatchingImage(pair.id, 'left')} className="mt-1 text-xs text-red-600 hover:underline">
                                    ✕ Суретті жою
                                  </button>
                                </div>
                              )}
                              {!pair.left.content && (
                                <p className="text-xs text-gray-400 italic">URL сілтемесін жоғарыдан енгізіңіз</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Правая сторона */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Оң жақ</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateMatchingPairItem(pair.id, 'right', 'type', pair.right.type === 'text' ? 'image' : 'text')}
                              className={`px-2 py-1 rounded text-xs font-medium transition flex-shrink-0 ${pair.right.type === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              {pair.right.type === 'image' ? '🖼 Сурет' : '📝 Мәтін'}
                            </button>
                          </div>
                          {pair.right.type === 'text' ? (
                            <input
                              type="text"
                              value={pair.right.content}
                              onChange={(e) => updateMatchingPairItem(pair.id, 'right', 'content', e.target.value)}
                              placeholder="Мәтін енгізіңіз"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                            />
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="url"
                                value={pair.right.content}
                                onChange={(e) => updateMatchingPairItem(pair.id, 'right', 'content', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-2 py-1.5 border border-purple-300 rounded text-sm focus:outline-none focus:border-purple-500 bg-white"
                              />
                              {pair.right.content && (
                                <div className="relative">
                                  <div className="relative w-full h-28 bg-gray-100 rounded overflow-hidden">
                                    <Image src={pair.right.content} alt="right" fill className="object-contain" sizes="200px"
                                      onError={() => updateMatchingPairItem(pair.id, 'right', 'content', '')}
                                    />
                                  </div>
                                  <button type="button" onClick={() => clearMatchingImage(pair.id, 'right')} className="mt-1 text-xs text-red-600 hover:underline">
                                    ✕ Суретті жою
                                  </button>
                                </div>
                              )}
                              {!pair.right.content && (
                                <p className="text-xs text-gray-400 italic">URL сілтемесін жоғарыдан енгізіңіз</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addMatchingPair} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition">
                  + Пара қосу
                </button>
              </div>
            </div>
          )}

          {/* TYPE 4: FILL IN THE BLANK */}
          {questionType === 'fillInTheBlank' && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-orange-800 mb-2">
                  Толық мәтін * (пропускты <code className="bg-orange-100 px-1 rounded">___</code> деп белгілеңіз)
                </label>
                <textarea
                  value={fillInBlankFullText}
                  onChange={(e) => setFillInBlankFullText(e.target.value)}
                  rows={3}
                  placeholder="мысалы: Күн жүйесінің орталық жұлдызы ___ деп аталады."
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm md:text-base"
                />
                <p className={`text-xs mt-1 font-medium ${fillInBlankFullText.includes('___') ? 'text-green-600' : 'text-red-500'}`}>
                  {fillInBlankFullText.includes('___') ? '✓ Пропуск белгісі табылды' : '✗ ___ белгісін қойыңыз'}
                </p>
              </div>

              {fillInBlankFullText.includes('___') && (
                <div className="bg-orange-100 p-3 rounded-lg text-sm">
                  <p className="font-medium text-orange-800 mb-1">Алдын ала қарау:</p>
                  <p className="text-gray-800">
                    {fillInBlankFullText.split('___')[0]}
                    <span className="inline-block mx-1 px-3 py-0.5 border-b-2 border-orange-500 bg-orange-50 text-orange-600 font-bold rounded">___</span>
                    {fillInBlankFullText.split('___')[1]}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs md:text-sm font-semibold text-orange-800 mb-2">
                  Дұрыс жауап вариациялары *
                </label>
                <p className="text-xs text-orange-700 mb-3">💡 Регистр ескерілмейді</p>
                <div className="space-y-3">
                  {fillInBlankVariations.map((variation, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={variation}
                        onChange={(e) => updateVariation(idx, e.target.value, 'fillInBlank')}
                        placeholder={`Вариация ${idx + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm md:text-base"
                      />
                      {fillInBlankVariations.length > 1 && (
                        <button type="button" onClick={() => removeVariation(idx, 'fillInBlank')} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition flex-shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addVariation('fillInBlank')} className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-sm transition">
                  + Вариация қосу
                </button>
              </div>
            </div>
          )}

          {/* Объяснение */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Түсіндіру (міндетті емес)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Жауап берілгеннен кейін ученикке көрсетілетін түсіндірме"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 md:gap-4 justify-end flex-col-reverse md:flex-row pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition disabled:opacity-50 text-sm md:text-base font-medium"
            >
              Бас тарту
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm md:text-base"
            >
              {isSubmitting ? 'Сақталуда...' : question ? 'Жаңарту' : 'Қосу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}