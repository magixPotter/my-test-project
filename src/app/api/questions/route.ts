import { NextRequest, NextResponse } from 'next/server'
import {
  getQuestionsByTest,
  createQuestion as createQuestionDB,
  deleteQuestion as deleteQuestionDB,
} from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json(
        { error: 'testId не указан' },
        { status: 400 }
      )
    }

    const questions = await getQuestionsByTest(testId)

    return NextResponse.json({ questions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении вопросов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testId, text, options, explanation } = body

    if (!testId || !text || !options) {
      return NextResponse.json(
        { error: 'testId, text и options обязательны' },
        { status: 400 }
      )
    }

    const questionId = await createQuestionDB(
      testId,
      text,
      options,
      explanation || ''
    )

    return NextResponse.json(
      { questionId, message: 'Вопрос создан успешно' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании вопроса' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionId } = body

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId не указан' },
        { status: 400 }
      )
    }

    await deleteQuestionDB(questionId)

    return NextResponse.json(
      { message: 'Вопрос удалён успешно' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении вопроса' },
      { status: 500 }
    )
  }
}