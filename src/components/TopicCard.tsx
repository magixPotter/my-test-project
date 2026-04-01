'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Topic } from '@/types'

interface TopicCardProps {
  topic: Topic
}

export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link href={`/topic/${topic.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
        {/* Картинка темы */}
        {topic.imageUrl && (
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={topic.imageUrl}
              alt={topic.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Информация о теме */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {topic.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {topic.description}
          </p>
        </div>
      </div>
    </Link>
  )
}