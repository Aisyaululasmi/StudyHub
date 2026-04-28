import Link from 'next/link'
import { FileText, ExternalLink } from 'lucide-react'
import { timeAgo } from '@/lib/time'
import { cn } from '@/lib/utils'

interface MiniPostCardProps {
  id: string
  title: string
  description: string | null
  type: 'link' | 'file' | 'text'
  mata_kuliah: string
  jurusan: string
  upvotes: number
  created_at: string
}

const typeConfig = {
  link: { label: 'Link', color: 'bg-blue-100 text-blue-700' },
  file: { label: 'File', color: 'bg-green-100 text-green-700' },
  text: { label: 'Teks', color: 'bg-purple-100 text-purple-700' },
}

export default function MiniPostCard({
  id,
  title,
  description,
  type,
  mata_kuliah,
  jurusan,
  upvotes,
  created_at,
}: MiniPostCardProps) {
  const typeStyle = typeConfig[type]

  return (
    <Link href={`/post/${id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Type badge */}
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2', typeStyle.color)}>
              {typeStyle.label}
            </span>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-[#2563EB]">
              {title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{mata_kuliah}</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{jurusan}</span>
              <span>• {timeAgo(created_at)}</span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>

          {/* Upvotes */}
          <div className="flex-shrink-0 text-center">
            <div className="text-lg font-bold text-green-600">{upvotes}</div>
            <div className="text-xs text-gray-500">upvotes</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
