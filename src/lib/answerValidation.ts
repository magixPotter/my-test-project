import {
  Question,
  QuestionOption,
  FreeTextOption,
  MatchingOption,
  FillInTheBlankOption,
} from '@/types'

// ===== Type 1: Multiple Choice =====
export function validateMultipleChoice(
  question: Question,
  selectedOptionIds: string[]
): boolean {
  const options = question.options as QuestionOption[]

  const correctOptions = options
    .filter((opt) => opt.isCorrect)
    .map((opt) => opt.id)

  if (selectedOptionIds.length !== correctOptions.length) {
    return false
  }

  return selectedOptionIds.every((id) => correctOptions.includes(id))
}

// ===== Type 2: Free Text Answer =====
export function validateFreeText(
  question: Question,
  userAnswer: string
): boolean {
  const options = question.options as FreeTextOption[]
  if (!options || options.length === 0) return false

  const variations = options[0].variations || []

  // Нормализовать ответ пользователя: удалить пробелы в начале/конце и привести к нижнему регистру
  const normalizedUser = userAnswer.trim().toLowerCase()

  // Проверить, совпадает ли хотя бы с одной вариацией
  return variations.some((variation) => {
    const normalizedVariation = variation.trim().toLowerCase()
    return normalizedUser === normalizedVariation
  })
}

// ===== Type 3: Matching =====
// userMatches может быть объектом { leftId: rightId } или массивом [{ leftId, rightId }]
// Возвращает количество правильных пар (partial scoring)
export function validateMatchingPartial(
  question: Question,
  userMatches: Record<string, string> | Array<{ leftId: string; rightId: string }>
): { correct: number; total: number } {
  const options = question.options as MatchingOption[]
  if (!options || options.length === 0) return { correct: 0, total: 0 }

  const allPairs = options[0].pairs
  const displayPairCount = options[0].displayPairCount

  let matchPairs: Array<{ leftId: string; rightId: string }>
  if (Array.isArray(userMatches)) {
    matchPairs = userMatches
  } else {
    matchPairs = Object.entries(userMatches).map(([leftId, rightId]) => ({ leftId, rightId }))
  }

  const correctCount = matchPairs.filter(({ leftId, rightId }) =>
    allPairs.some((pair) => pair.left.id === leftId && pair.right.id === rightId)
  ).length

  return { correct: correctCount, total: displayPairCount }
}

export function validateMatching(
  question: Question,
  userMatches: Record<string, string> | Array<{ leftId: string; rightId: string }>
): boolean {
  const { correct, total } = validateMatchingPartial(question, userMatches)
  return total > 0 && correct === total
}

// ===== Type 4: Fill in the Blank =====
export function validateFillInTheBlank(
  question: Question,
  userAnswer: string
): boolean {
  const options = question.options as FillInTheBlankOption[]
  if (!options || options.length === 0) return false

  const variations = options[0].variations || []

  // Нормализовать ответ пользователя
  const normalizedUser = userAnswer.trim().toLowerCase()

  // Проверить, совпадает ли хотя бы с одной вариацией
  return variations.some((variation) => {
    const normalizedVariation = variation.trim().toLowerCase()
    return normalizedUser === normalizedVariation
  })
}

// ===== ГЛАВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ =====
export function validateAnswer(
  question: Question,
  userInput: any
): boolean {
  try {
    switch (question.type) {
      case 'multipleChoice':
        return validateMultipleChoice(question, userInput as string[])

      case 'freeText':
        return validateFreeText(question, userInput as string)

      case 'matching':
        return validateMatching(
          question,
          userInput as Record<string, string>
        )

      case 'fillInTheBlank':
        return validateFillInTheBlank(question, userInput as string)

      default:
        console.error(`Unknown question type: ${question.type}`)
        return false
    }
  } catch (error) {
    console.error('Error validating answer:', error)
    return false
  }
}