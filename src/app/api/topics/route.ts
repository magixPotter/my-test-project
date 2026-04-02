import { NextRequest, NextResponse } from 'next/server'
import { getTopics, createTopic as createTopicDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/topics - запрос получен')
    const topics = await getTopics()
    console.log('GET /api/topics - темы загружены:', topics.length)
    return NextResponse.json({ topics }, { status: 200 })
  } catch (error) {
    console.error('GET /api/topics - ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении тем' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/topics - запрос получен')
    const body = await request.json()
    console.log('POST /api/topics - данные:', body)

    const { name, description, imageUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Название темы обязательно' },
        { status: 400 }
      )
    }

    console.log('POST /api/topics - создаём тему в БД...')
    const topicId = await createTopicDB(name, description || '', imageUrl || '')
    console.log('POST /api/topics - тема создана:', topicId)

    // ✅ НОВОЕ: Автоматически создать тесты A, B, C
    const { createDefaultTests } = await import('@/lib/db')
    await createDefaultTests(topicId)
    console.log('POST /api/topics - тесты созданы')

    return NextResponse.json(
      { topicId, message: 'Тема и тесты созданы успешно' },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/topics - ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании темы' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('id')

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    console.log('DELETE /api/topics - удаляем тему:', topicId)
    const { deleteTopic } = await import('@/lib/db')
    await deleteTopic(topicId)
    console.log('DELETE /api/topics - тема удалена')

    return NextResponse.json(
      { message: 'Topic deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/topics - ошибка:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}