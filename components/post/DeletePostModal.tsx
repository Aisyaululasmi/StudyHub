'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DeletePostModalProps {
  postId: string
  postTitle: string
  onClose: () => void
}

export default function DeletePostModal({
  postId,
  postTitle,
  onClose,
}: DeletePostModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      toast.success('Materi berhasil dihapus')

      // Redirect to feed
      setTimeout(() => {
        router.push('/feed')
      }, 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus materi')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Hapus Materi?
          </h3>
          <p className="text-gray-600 mb-2">
            Anda akan menghapus materi:
          </p>
          <p className="font-medium text-gray-900 line-clamp-2">
            "{postTitle}"
          </p>
          <p className="text-sm text-red-600 mt-4">
            ⚠️ Tindakan ini tidak bisa dibatalkan
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Ya, Hapus'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
