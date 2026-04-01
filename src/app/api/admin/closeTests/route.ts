import { NextRequest, NextResponse } from 'next/server'
import { closeAllTests, openAllTests } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body // 'close' или 'open'

    if (!action || !['close', 'open'].includes(action)) {
      return NextResponse.json(
        { error: 'action должен быть "close" или "open"' },
        { status: 400 }
      )
    }

    if (action === 'close') {
      await closeAllTests()
    } else {
      await openAllTests()
    }

    return NextResponse.json(
      { message: `Все тесты ${action === 'close' ? 'закрыты' : 'открыты'}` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error managing tests:', error)
    return NextResponse.json(
      { error: 'Ошибка при управлении тестами' },
      { status: 500 }
    )
  }
}