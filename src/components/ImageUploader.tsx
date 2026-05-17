'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
  label?: string
}

// Simple URL-based image uploader — no server needed
export default function ImageUploader({
  onImageUpload,
  currentImage,
  label = 'Сурет URL',
}: ImageUploaderProps) {
  const [url, setUrl] = useState(currentImage || '')
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState('')

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setError('')
    if (!value.trim()) {
      setPreview(null)
      onImageUpload('')
    }
  }

  const handleConfirm = () => {
    if (!url.trim()) return
    setPreview(url.trim())
    onImageUpload(url.trim())
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleConfirm}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          ✓
        </button>
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {preview && (
        <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="preview"
            fill
            className="object-contain"
            sizes="128px"
            onError={() => { setError('URL дұрыс емес немесе сурет жүктелмеді'); setPreview(null) }}
          />
        </div>
      )}

      {preview && (
        <button
          type="button"
          onClick={() => { setUrl(''); setPreview(null); onImageUpload('') }}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          ✖ Өшіру
        </button>
      )}
    </div>
  )
}