import { ADMIN_PASSWORD } from './constants'

// Проверить пароль админа
export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

// Создать JWT токен (упрощённая версия)
export function createAdminToken(): string {
  return Buffer.from(JSON.stringify({ admin: true, time: Date.now() })).toString('base64')
}

// Проверить JWT токен
export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    return decoded.admin === true
  } catch {
    return false
  }
}