export interface Topic {
  id: string
  name: string
  description: string
  imageUrl: string
  createdAt: Date
  order: number
  status: 'active' | 'closed'
}

export interface Test {
  id: string
  topicId: string
  level: 'A' | 'B' | 'C'
  maxAttempts: number
  passingScore: number
  questionsPerTest: number
  totalQuestions: number
  status: 'active' | 'closed'
  createdAt: Date
}

// ===== TYPE 1: Multiple Choice (Множественный выбор) =====
export interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

// ===== TYPE 2: Free Text Answer (Свободный текстовый ответ) =====
export interface FreeTextOption {
  id: string
  variations: string[] // ["Солнце", "солнце", "СОЛНЦЕ", "звезда солнце"]
}

// ===== TYPE 3: Matching (Соответствие) =====
export interface MatchingItem {
  id: string
  content: string // Текст ИЛИ URL фото
  type: 'text' | 'image'
  label?: string // Опционально, для хранения оригинального имени файла
}

export interface MatchingPair {
  id: string
  left: MatchingItem
  right: MatchingItem
  pairIndex: number // Индекс пары для уникального цвета
}

export interface MatchingOption {
  id: string
  pairs: MatchingPair[] // Все пары в банке
  displayPairCount: number // Сколько пар показать ученику (5 из 20)
}

// ===== TYPE 4: Fill in the Blank (Заполнить пропуск) =====
export interface FillInTheBlankOption {
  id: string
  fullText: string // Полное предложение с маркером "___"
  variations: string[] // ["Солнце", "солнце", "звезда"]
}

// ===== UNION ДЛЯ ВСЕХ ТИПОВ ОПЦИЙ =====
export type QuestionOptions =
  | QuestionOption[] // Type 1: Multiple Choice
  | FreeTextOption[] // Type 2: Free Text
  | MatchingOption[] // Type 3: Matching
  | FillInTheBlankOption[] // Type 4: Fill in Blank

export type QuestionType = 'multipleChoice' | 'freeText' | 'matching' | 'fillInTheBlank'

export interface Question {
  id: string
  testId: string
  type: QuestionType
  text: string // Вопрос/инструкция
  options: QuestionOptions
  explanation: string
  order: number
  instruction?: string // Мини-инструкция для ученика
}

export interface StudentProgress {
  id: string
  studentName: string
  topicId: string
  currentLevel: 'A' | 'B' | 'C'
  levelProgress: {
    [key: string]: {
      attempts: number
      maxAttempts: number
      usedQuestions: string[]
      status: 'in_progress' | 'passed' | 'failed' | 'locked'
      bestScore: number | null
    }
  }
  updatedAt: Date
}

export interface TestResult {
  id: string
  studentName: string
  topicId: string
  testLevel: 'A' | 'B' | 'C'
  attemptNumber: number
  selectedQuestions: string[]
  answers: {
    questionId: string
    questionType: QuestionType
    userAnswer:
      | string // Type 1: option id или Type 2,4: текст ответа
      | string[] // Type 1: несколько option ids
      | Array<{ leftId: string; rightId: string }> // Type 3: matching pairs
    isCorrect: boolean
  }[]
  score: number
  totalQuestions: number
  percentage: number
  passed: boolean
  completedAt: Date
  ipAddress?: string
  nextTestLevel?: 'B' | 'C' | null
}