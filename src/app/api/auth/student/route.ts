import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateStudentProgress } from '@/lib/db'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { studentName } = await request.json()

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: 'Имя ученика обязательно' },
        { status: 400 }
      )
    }

    // Проверить если студент уже сущест��ует
    const response = new NextResponse(
      JSON.stringify({
        studentName,
        message: 'Студент вошел успешно',
      }),
      { status: 200 }
    )

    // Сохранить имя студента в cookies
    response.cookies.set('studentName', studentName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    })

    return response
  } catch (error) {
    console.error('Error in student auth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const studentName = request.cookies.get('studentName')?.value

    if (!studentName) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { studentName },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in student auth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}