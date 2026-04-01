import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateStudentProgress,
  updateStudentProgress as updateStudentProgressDB,
} from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentName = searchParams.get('studentName')
    const topicId = searchParams.get('topicId')

    if (!studentName || !topicId) {
      return NextResponse.json(
        { error: 'studentName и topicId обязательны' },
        { status: 400 }
      )
    }

    const progress = await getOrCreateStudentProgress(studentName, topicId)

    return NextResponse.json({ progress }, { status: 200 })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении прогресса' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { progressId, ...data } = body

    if (!progressId) {
      return NextResponse.json(
        { error: 'progressId не указан' },
        { status: 400 }
      )
    }

    await updateStudentProgressDB(progressId, data)

    return NextResponse.json(
      { message: 'Прогресс обновлён успешно' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении прогресса' },
      { status: 500 }
    )
  }
}