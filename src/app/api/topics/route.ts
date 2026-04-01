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

    return NextResponse.json(
      { topicId, message: 'Тема создана успешно' },
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