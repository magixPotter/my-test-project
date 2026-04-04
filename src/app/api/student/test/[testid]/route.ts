import { NextRequest, NextResponse } from 'next/server'
import { getTest, getQuestionsByTest } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testid: string }> }
) {
  try {
    console.log('🔍 [TEST ROUTE] GET /api/student/test/:id called')  // ← Это
    const { testid } = await params
    console.log('🔍 [TEST ROUTE] Received testid:', testid)  // ← И это
    console.log('🔍 [TEST ROUTE] Request URL:', request.url)  // ← И это
    
    if (!testid) {
      console.log('❌ [TEST ROUTE] testid is empty!')
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    const test = await getTest(testid)
    console.log('🔍 [TEST ROUTE] Found test:', test?.id)  // ← И это
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    const questions = await getQuestionsByTest(testid)

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