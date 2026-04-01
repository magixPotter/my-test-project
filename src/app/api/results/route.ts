import { NextRequest, NextResponse } from 'next/server'
import {
  getAllResults,
  getStudentResults,
  saveTestResult as saveTestResultDB,
} from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentName = searchParams.get('studentName')

    let results
    if (studentName) {
      results = await getStudentResults(studentName)
    } else {
      results = await getAllResults()
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении результатов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const resultId = await saveTestResultDB(body)

    return NextResponse.json(
      { resultId, message: 'Результат сохранён успешно' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving result:', error)
    return NextResponse.json(
      { error: 'Ошибка при сохранении результата' },
      { status: 500 }
    )
  }
}