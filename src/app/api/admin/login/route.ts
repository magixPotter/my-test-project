import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, createAdminToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Пароль не указан' },
        { status: 400 }
      )
    }

    // Проверить пароль
    if (!checkAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      )
    }

    // Создать токен
    const token = createAdminToken()

    return NextResponse.json(
      { token, message: 'Успешно вошли' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}