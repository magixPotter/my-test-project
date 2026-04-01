export interface Topic {
  id: string
  name: string
  description: string
  imageUrl: string
  createdAt: Date
  order: number
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

export interface Question {
  id: string
  testId: string
  text: string
  options: QuestionOption[]
  explanation: string
  order: number
}

export interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
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
    selectedOptions: string[]
    isCorrect: boolean
  }[]
  score: number
  totalQuestions: number
  percentage: number
  passed: boolean
  completedAt: Date
  ipAddress?: string
}