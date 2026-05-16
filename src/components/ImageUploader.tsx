'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
  label?: string
}

export default function ImageUploader({
  onImageUpload,
  currentImage,
  label = 'Суретті жүктеу',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Проверить тип файла
    if (!file.type.startsWith('image/')) {
      setError('Суретті ғана жүктеуге болады')
      return
    }

    // Проверить размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Сурет өлшемі 5MB-ты аспау керек')
      return
    }

    try {
      setUploading(true)
      setError('')

      // Создать превью
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Загрузить на сервер
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Суретті жүктеу кезінде қате')
        return
      }

      const data = await response.json()
      onImageUpload(data.imageUrl)
    } catch (err) {
      setError('Суретті жүктеу кезінде қате')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition text-center"
      >
        {preview ? (
          <div className="relative w-32 h-32 mx-auto">
            <Image
              src={preview}
              alt="preview"
              fill
              className="object-contain"
              sizes="128px"
            />
          </div>
        ) : (
          <div className="py-8">
            <p className="text-gray-600 text-sm">📸 Сурет таңдау немесе перетасу</p>
            <p className="text-gray-500 text-xs mt-1">PNG, JPG, GIF (макс 5MB)</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {uploading && <p className="text-blue-600 text-sm">Жүктелуде...</p>}

      {preview && !uploading && (
        <button
          type="button"
          onClick={() => {
            setPreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          ✖ Өшіру
        </button>
      )}
    </div>
  )
}