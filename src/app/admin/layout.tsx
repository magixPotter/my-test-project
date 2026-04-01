'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminNav from '@/components/AdminNav'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверить токен
    const token = localStorage.getItem('adminToken')

    // Если на странице логина, разрешить доступ
    if (pathname === '/admin/login') {
      setIsAuthorized(true)
      setLoading(false)
      return
    }

    // Если нет токена и не на странице логина - перенаправить
    if (!token) {
      router.push('/admin/login')
      return
    }

    // Если есть токен - разрешить доступ
    setIsAuthorized(true)
    setLoading(false)
  }, [pathname, router])

  if (loading) return <LoadingSpinner />

  if (!isAuthorized && pathname !== '/admin/login') {
    return <LoadingSpinner />
  }

  return (
    <>
      {pathname !== '/admin/login' && <AdminNav />}
      <main className={pathname === '/admin/login' ? '' : 'min-h-screen bg-gray-50'}>
        {children}
      </main>
    </>
  )
}