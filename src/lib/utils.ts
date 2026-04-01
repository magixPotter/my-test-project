// Выбрать N рандомных элементов из массива
export function getRandomItems<T>(array: T[], count: number): T[] {
  if (count >= array.length) return [...array]

  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Посчитать правильные ответы
export function calculateScore(
  answers: {
    questionId: string
    selectedOptions: string[]
    isCorrect: boolean
  }[]
): { correct: number; total: number; percentage: number } {
  const correct = answers.filter((a) => a.isCorrect).length
  const total = answers.length
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  return { correct, total, percentage }
}

// Форматировать дату
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Формировать проценты
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`
}

// Генерировать уникальный ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Получить IP адрес (клиентская версия)
export async function getClientIp(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return null
  }
}