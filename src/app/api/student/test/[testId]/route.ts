import { NextRequest, NextResponse } from 'next/server'
import { getTest, getQuestionsByTest } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params
    
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    const test = await getTest(testId)
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    const questions = await getQuestionsByTest(testId)

    return NextResponse.json(
      { test, questions },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}