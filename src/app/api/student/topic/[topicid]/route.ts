import { NextRequest, NextResponse } from 'next/server'
import { getTopic, getTestsByTopic, getOrCreateStudentProgress } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicid: string }> }
) {
  try {
    const { topicid } = await params
    const topicId = topicid
    const studentName = request.nextUrl.searchParams.get('studentName')

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Получить тему
    const topic = await getTopic(topicId)
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    if (topic.status === 'closed') {
      return NextResponse.json(
        { error: 'This topic is closed' },
        { status: 403 }
      )
    }

    // Получить тесты
    const tests = await getTestsByTopic(topicId)
    const activeTests = tests.filter((t) => t.status === 'active')
      .sort((a, b) => a.level.localeCompare(b.level))

    // Получить прогресс ученика (если указан)
    let progress = null
    if (studentName) {
      progress = await getOrCreateStudentProgress(studentName, topicId)
    }

    return NextResponse.json(
      { topic, tests: activeTests, progress },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/student/topic/:id - ошибка:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}