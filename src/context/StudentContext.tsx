'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface StudentContextType {
  studentName: string | null
  setStudentName: (name: string) => void
  logout: () => void
  isLoading: boolean
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [studentName, setStudentNameState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Проверить сессию при загрузке
  useEffect(() => {
    const checkSession = async () => {
  try {
    const response = await fetch('/api/auth/student')
    if (response.ok) {
      const data = await response.json()
      setStudentNameState(data.studentName)
    } else if (response.status === 401) {
      // Студент не залогинен - это нормально
      setStudentNameState(null)
    }
  } catch (error) {
    console.error('Error checking session:', error)
  } finally {
    setIsLoading(false)
  }
}

    checkSession()
  }, [])

  const setStudentName = (name: string) => {
    setStudentNameState(name)
  }

  const logout = () => {
    setStudentNameState(null)
  }

  return (
    <StudentContext.Provider value={{ studentName, setStudentName, logout, isLoading }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const context = useContext(StudentContext)
  if (context === undefined) {
    throw new Error('useStudent must be used within StudentProvider')
  }
  return context
}