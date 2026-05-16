import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Файл табылмады' }, { status: 400 })
    }

    // Прочитать файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ресайзить фото (300x300 для мобильных и десктопов)
    const resizedBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover', // Обрезать, если нужно
        position: 'center',
      })
      .toBuffer()

    // Загрузить в Firebase Storage
    const fileName = `matching_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storageRef = ref(storage, fileName)

    const snapshot = await uploadBytes(storageRef, resizedBuffer, {
      contentType: 'image/jpeg',
    })

    // Получить URL
    const imageUrl = await getDownloadURL(snapshot.ref)

    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Суретті жүктеу кезінде қате' }, { status: 500 })
  }
}