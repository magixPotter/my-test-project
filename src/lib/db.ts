import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  Topic,
  Test,
  Question,
  StudentProgress,
  TestResult,
} from '@/types'

// ============ TOPICS (ТЕМЫ) ============

// Получить все темы
export async function getTopics(): Promise<Topic[]> {
  try {
    const q = query(collection(db, 'topics'), orderBy('order', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Topic[]
  } catch (error) {
    console.error('Error fetching topics:', error)
    return []
  }
}

// Получить одну тему по ID
export async function getTopic(topicId: string): Promise<Topic | null> {
  try {
    if (!topicId || topicId.trim() === '') {
      console.warn('getTopic: topicId is empty')
      return null
    }

    const docSnap = await getDoc(doc(db, 'topics', topicId))
    if (!docSnap.exists()) {
      console.warn(`getTopic: Document not found for ID ${topicId}`)
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      name: data?.name || '',
      description: data?.description || '',
      imageUrl: data?.imageUrl || '',
      createdAt: data?.createdAt?.toDate?.() || new Date(),
      order: data?.order || 0,
      status: data?.status || 'active',
    } as Topic
  } catch (error) {
    console.error('Error fetching topic:', error)
    return null
  }
}

// Создать новую тему
export async function createTopic(
  name: string,
  description: string,
  imageUrl: string
): Promise<string> {
  try {
    const topicsRef = collection(db, 'topics')
    const allTopics = await getDocs(topicsRef)
    const order = allTopics.size + 1

    const docRef = await addDoc(topicsRef, {
      name,
      description,
      imageUrl,
      order,
      status: 'active', 
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating topic:', error)
    throw error
  }
}
// Создать тесты для новой темы (A, B, C уровни)
export async function createDefaultTests(topicId: string): Promise<void> {
  try {
    const levels: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C']
    const config = {
      A: { maxAttempts: 3, passingScore: 60, questionsPerTest: 5 },
      B: { maxAttempts: 2, passingScore: 70, questionsPerTest: 5 },
      C: { maxAttempts: 1, passingScore: 80, questionsPerTest: 5 },
    }

    for (const level of levels) {
      await createTest(
        topicId,
        level,
        config[level].maxAttempts,
        config[level].passingScore,
        config[level].questionsPerTest,
        0
      )
    }

    console.log(`Default tests created for topic ${topicId}`)
  } catch (error) {
    console.error('Error creating default tests:', error)
    throw error
  }
}

// Обновить тему
export async function updateTopic(
  topicId: string,
  name: string,
  description: string,
  imageUrl: string,
  status?: 'active' | 'closed'
): Promise<void> {
  try {
    const updateData: Record<string, string | 'active' | 'closed'> = {
      name,
      description,
      imageUrl,
    }
    if (status) {
      updateData.status = status
    }
    await updateDoc(doc(db, 'topics', topicId), updateData)
  } catch (error) {
    console.error('Error updating topic:', error)
    throw error
  }
}

// Удалить тему и ВСЕ СВЯЗАННЫЕ ДАННЫЕ
export async function deleteTopic(topicId: string): Promise<void> {
  try {
    // 1. Найти все тесты этой темы
    const testsQuery = query(collection(db, 'tests'), where('topicId', '==', topicId))
    const testsSnapshot = await getDocs(testsQuery)

    // 2. Для каждого теста удалить ВСЕ вопросы
    for (const testDoc of testsSnapshot.docs) {
      const testId = testDoc.id
      const questionsQuery = query(
        collection(db, 'questions'),
        where('testId', '==', testId)
      )
      const questionsSnapshot = await getDocs(questionsQuery)

      // Удалить все вопросы этого теста
      for (const questionDoc of questionsSnapshot.docs) {
        await deleteDoc(doc(db, 'questions', questionDoc.id))
      }

      // Удалить сам тест
      await deleteDoc(doc(db, 'tests', testId))
    }

    // 3. Удалить все результаты студентов по этой теме
    const resultsQuery = query(
      collection(db, 'results'),
      where('topicId', '==', topicId)
    )
    const resultsSnapshot = await getDocs(resultsQuery)
    for (const resultDoc of resultsSnapshot.docs) {
      await deleteDoc(doc(db, 'results', resultDoc.id))
    }

    // 4. Удалить все прогрессы студентов по этой теме
    const progressQuery = query(
      collection(db, 'studentProgress'),
      where('topicId', '==', topicId)
    )
    const progressSnapshot = await getDocs(progressQuery)
    for (const progressDoc of progressSnapshot.docs) {
      await deleteDoc(doc(db, 'studentProgress', progressDoc.id))
    }

    // 5. Удалить саму тему
    await deleteDoc(doc(db, 'topics', topicId))

    console.log(`Topic ${topicId} and all related data deleted successfully`)
  } catch (error) {
    console.error('Error deleting topic:', error)
    throw error
  }
}

// Изменить статус всех тестов по теме
export async function updateTopicTestsStatus(
  topicId: string,
  status: 'active' | 'closed'
): Promise<void> {
  try {
    const q = query(
      collection(db, 'tests'),
      where('topicId', '==', topicId)
    )
    const testsSnapshot = await getDocs(q)
    const batch = []

    for (const docSnap of testsSnapshot.docs) {
      batch.push(
        updateDoc(doc(db, 'tests', docSnap.id), {
          status,
        })
      )
    }

    await Promise.all(batch)
  } catch (error) {
    console.error('Error updating topic tests status:', error)
    throw error
  }
}

// ============ TESTS (ТЕСТЫ) ============

// Получить все тесты по теме
export async function getTestsByTopic(topicId: string): Promise<Test[]> {
  try {
    const q = query(
      collection(db, 'tests'),
      where('topicId', '==', topicId),
      orderBy('level', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Test[]
  } catch (error) {
    console.error('Error fetching tests:', error)
    return []
  }
}

// Получить один тест по ID
export async function getTest(testId: string): Promise<Test | null> {
  try {
    const docSnap = await getDoc(doc(db, 'tests', testId))
    if (!docSnap.exists()) return null
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
    } as Test
  } catch (error) {
    console.error('Error fetching test:', error)
    return null
  }
}

// Создать новый тест
export async function createTest(
  topicId: string,
  level: 'A' | 'B' | 'C',
  maxAttempts: number,
  passingScore: number,
  questionsPerTest: number,
  totalQuestions: number
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'tests'), {
      topicId,
      level,
      maxAttempts,
      passingScore,
      questionsPerTest,
      totalQuestions,
      status: 'active',
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating test:', error)
    throw error
  }
}

// Обновить тест
export async function updateTest(
  testId: string,
  data: Partial<Test>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'tests', testId), data)
  } catch (error) {
    console.error('Error updating test:', error)
    throw error
  }
}

// ============ QUESTIONS (ВОПРОСЫ) ============

// Получить все вопросы теста
export async function getQuestionsByTest(testId: string): Promise<Question[]> {
  try {
    const q = query(
      collection(db, 'questions'),
      where('testId', '==', testId),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Question[]
  } catch (error) {
    console.error('Error fetching questions:', error)
    return []
  }
}

// Получить один вопрос по ID
export async function getQuestion(questionId: string): Promise<Question | null> {
  try {
    const docSnap = await getDoc(doc(db, 'questions', questionId))
    if (!docSnap.exists()) return null
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Question
  } catch (error) {
    console.error('Error fetching question:', error)
    return null
  }
}

// Создать новый вопрос
export async function createQuestion(
  testId: string,
  text: string,
  options: { text: string; isCorrect: boolean }[],
  explanation?: string
): Promise<string> {
  try {
    const allQuestions = await getQuestionsByTest(testId)
    const order = allQuestions.length + 1

    const docRef = await addDoc(collection(db, 'questions'), {
      testId,
      text,
      options: options.map((opt, idx) => ({
        id: `opt_${idx}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: explanation || '',
      order,
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating question:', error)
    throw error
  }
}

// Обновить вопрос
export async function updateQuestion(
  questionId: string,
  text: string,
  options: { text: string; isCorrect: boolean }[],
  explanation?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'questions', questionId), {
      text,
      options: options.map((opt, idx) => ({
        id: `opt_${idx}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: explanation || '',
    })
  } catch (error) {
    console.error('Error updating question:', error)
    throw error
  }
}

// Удалить вопрос
export async function deleteQuestion(questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'questions', questionId))
  } catch (error) {
    console.error('Error deleting question:', error)
    throw error
  }
}

// ============ STUDENT PROGRESS (ПРОГРЕСС УЧЕНИКА) ============

// Получить или создать прогресс ученика по теме
export async function getOrCreateStudentProgress(
  studentName: string,
  topicId: string
): Promise<StudentProgress> {
  try {
    const q = query(
      collection(db, 'studentProgress'),
      where('studentName', '==', studentName),
      where('topicId', '==', topicId)
    )
    const snapshot = await getDocs(q)

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as StudentProgress
    }

    // Создать новый прогресс
    const docRef = await addDoc(collection(db, 'studentProgress'), {
      studentName,
      topicId,
      currentLevel: 'A',
      levelProgress: {
        A: {
          attempts: 0,
          maxAttempts: 3,
          usedQuestions: [],
          status: 'in_progress',
          bestScore: null,
        },
        B: {
          attempts: 0,
          maxAttempts: 2,
          usedQuestions: [],
          status: 'locked',
          bestScore: null,
        },
        C: {
          attempts: 0,
          maxAttempts: 1,
          usedQuestions: [],
          status: 'locked',
          bestScore: null,
        },
      },
      updatedAt: new Date(),
    })

    return {
      id: docRef.id,
      studentName,
      topicId,
      currentLevel: 'A',
      levelProgress: {
        A: {
          attempts: 0,
          maxAttempts: 3,
          usedQuestions: [],
          status: 'in_progress',
          bestScore: null,
        },
        B: {
          attempts: 0,
          maxAttempts: 2,
          usedQuestions: [],
          status: 'locked',
          bestScore: null,
        },
        C: {
          attempts: 0,
          maxAttempts: 1,
          usedQuestions: [],
          status: 'locked',
          bestScore: null,
        },
      },
      updatedAt: new Date(),
    } as StudentProgress
  } catch (error) {
    console.error('Error getting student progress:', error)
    throw error
  }
}

// Обновить прогресс ученика
export async function updateStudentProgress(
  progressId: string,
  data: Partial<StudentProgress>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'studentProgress', progressId), {
      ...data,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error updating student progress:', error)
    throw error
  }
}

// ============ TEST RESULTS (РЕЗУЛЬТАТЫ ТЕСТОВ) ============

// Сохранить результат теста
export async function saveTestResult(result: Omit<TestResult, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'results'), {
      ...result,
      completedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving test result:', error)
    throw error
  }
}

// Получить все результаты ученика
export async function getStudentResults(studentName: string): Promise<TestResult[]> {
  try {
    const q = query(
      collection(db, 'results'),
      where('studentName', '==', studentName),
      orderBy('completedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate?.() || new Date(),
    })) as TestResult[]
  } catch (error) {
    console.error('Error fetching student results:', error)
    return []
  }
}

// Получить все результаты по теме
export async function getResultsByTopic(topicId: string): Promise<TestResult[]> {
  try {
    const q = query(
      collection(db, 'results'),
      where('topicId', '==', topicId),
      orderBy('completedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate?.() || new Date(),
    })) as TestResult[]
  } catch (error) {
    console.error('Error fetching topic results:', error)
    return []
  }
}

// Получить все результаты (для админа)
export async function getAllResults(): Promise<TestResult[]> {
  try {
    const q = query(
      collection(db, 'results'),
      orderBy('completedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate?.() || new Date(),
    })) as TestResult[]
  } catch (error) {
    console.error('Error fetching all results:', error)
    return []
  }
}

// ============ ЗАКРЫТИЕ ТЕСТОВ ============

// Закрыть все тесты (для админа)
export async function closeAllTests(): Promise<void> {
  try {
    const testsSnapshot = await getDocs(collection(db, 'tests'))
    const batch = []

    for (const docSnap of testsSnapshot.docs) {
      batch.push(
        updateDoc(doc(db, 'tests', docSnap.id), {
          status: 'closed',
        })
      )
    }

    await Promise.all(batch)
  } catch (error) {
    console.error('Error closing tests:', error)
    throw error
  }
}

// Открыть все тесты (для админа)
export async function openAllTests(): Promise<void> {
  try {
    const testsSnapshot = await getDocs(collection(db, 'tests'))
    const batch = []

    for (const docSnap of testsSnapshot.docs) {
      batch.push(
        updateDoc(doc(db, 'tests', docSnap.id), {
          status: 'active',
        })
      )
    }

    await Promise.all(batch)
  } catch (error) {
    console.error('Error opening tests:', error)
    throw error
  }
}