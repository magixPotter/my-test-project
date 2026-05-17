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
export function validateMatching(
  question: Question,
  userMatches: Record<string, string> | Array<{ leftId: string; rightId: string }>
): boolean {
  const options = question.options as MatchingOption[]
  if (!options || options.length === 0) return false

  const allPairs = options[0].pairs
  const displayPairCount = options[0].displayPairCount

  // Нормализовать входные данные в массив пар
  let matchPairs: Array<{ leftId: string; rightId: string }>
  if (Array.isArray(userMatches)) {
    matchPairs = userMatches
  } else {
    matchPairs = Object.entries(userMatches).map(([leftId, rightId]) => ({ leftId, rightId }))
  }

  // Количество ответов пользователя должно совпадать с displayPairCount
  if (matchPairs.length !== displayPairCount) {
    return false
  }

  // Каждая пара пользователя должна соответствовать правильной паре из банка
  return matchPairs.every(({ leftId, rightId }) => {
    return allPairs.some(
      (pair) => pair.left.id === leftId && pair.right.id === rightId
    )
  })
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