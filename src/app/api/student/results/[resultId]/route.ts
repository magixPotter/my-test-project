import { NextRequest, NextResponse } from 'next/server'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultid: string }> }
) {
  try {
    const { resultid } = await params
    
    if (!resultid) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      )
    }

    const docSnap = await getDoc(doc(db, 'results', resultid))
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    const result = {
      id: docSnap.id,
      ...docSnap.data(),
      completedAt: docSnap.data().completedAt?.toDate?.() || new Date(),
    }

    return NextResponse.json(
      { result },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}