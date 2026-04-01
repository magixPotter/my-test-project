export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export const LEVELS = ['A', 'B', 'C'] as const

export const LEVEL_CONFIG = {
  A: { maxAttempts: 3, passingScore: 60 },
  B: { maxAttempts: 2, passingScore: 60 },
  C: { maxAttempts: 1, passingScore: 60 },
}

export const QUESTIONS_PER_TEST = 5