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
export function validateMatching(
  question: Question,
  userMatches: Array<{ leftId: string; rightId: string }>
): boolean {
  const options = question.options as MatchingOption[]
  if (!options || options.length === 0) return false

  // Получить только ОТОБРАЖАЕМЫЕ пары (первые displayPairCount)
  const displayedPairs = options[0].pairs.slice(0, options[0].displayPairCount)

  // Проверить количество пар
  if (userMatches.length !== displayedPairs.length) {
    return false
  }

  // Каждая пара пользователя должна совпадать с правильной парой из отображаемых
  return userMatches.every((userMatch) => {
    return displayedPairs.some(
      (pair) =>
        pair.left.id === userMatch.leftId && pair.right.id === userMatch.rightId
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
          userInput as Array<{ leftId: string; rightId: string }>
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