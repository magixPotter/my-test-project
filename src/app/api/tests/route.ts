import { NextRequest, NextResponse } from 'next/server'
import { getTestsByTopic, createTest as createTestDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicid')

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId не указан' },
        { status: 400 }
      )
    }

    const tests = await getTestsByTopic(topicId)

    return NextResponse.json({ tests }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении тестов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topicId,
      level,
      maxAttempts,
      passingScore,
      questionsPerTest,
      totalQuestions,
    } = body

    if (!topicId || !level) {
      return NextResponse.json(
        { error: 'topicId и level обязательны' },
        { status: 400 }
      )
    }

    const testId = await createTestDB(
      topicId,
      level,
      maxAttempts || 3,
      passingScore || 60,
      questionsPerTest || 5,
      totalQuestions || 20
    )

    return NextResponse.json(
      { testId, message: 'Тест создан успешно' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating test:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании теста' },
      { status: 500 }
    )
  }
}