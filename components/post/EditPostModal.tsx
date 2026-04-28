'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const jurusanList = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Manajemen',
  'Akuntansi',
  'Hukum',
  'Kedokteran',
  'Psikologi',
  'Ilmu Komunikasi',
  'Desain Komunikasi Visual',
  'Arsitektur',
]

interface EditPostModalProps {
  post: {
    id: string
    title: string
    description: string | null
    mata_kuliah: string
    jurusan: string
    tags: string[] | null
  }
  onClose: () => void
}

export default function EditPostModal({ post, onClose }: EditPostModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(post.title)
  const [description, setDescription] = useState(post.description || '')
  const [mataKuliah, setMataKuliah] = useState(post.mata_kuliah)
  const [jurusan, setJurusan] = useState(post.jurusan)
  const [tags, setTags] = useState<string[]>(post.tags || [])
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Judul harus diisi')
      return
    }

    if (title.length > 100) {
      toast.error('Judul maksimal 100 karakter')
      return
    }

    if (!mataKuliah.trim()) {
      toast.error('Mata kuliah harus diisi')
      return
    }

    if (!jurusan) {
      toast.error('Jurusan harus dipilih')
      return
    }

    if (description.length > 500) {
      toast.error('Deskripsi maksimal 500 karakter')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          mata_kuliah: mataKuliah.trim(),
          jurusan,
          tags: tags.length > 0 ? tags : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }

      toast.success('Post berhasil diupdate')
      onClose()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate post')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Materi</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Judul <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cth: Modul Pembelajaran Basis Data"
              maxLength={100}
              disabled={loading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">{title.length}/100 karakter</p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan materi ini secara singkat..."
              rows={4}
              maxLength={500}
              disabled={loading}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/500 karakter</p>
          </div>

          {/* Mata Kuliah */}
          <div>
            <Label htmlFor="mata_kuliah">
              Mata Kuliah <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mata_kuliah"
              value={mataKuliah}
              onChange={(e) => setMataKuliah(e.target.value)}
              placeholder="Cth: Basis Data"
              disabled={loading}
              required
            />
          </div>

          {/* Jurusan */}
          <div>
            <Label htmlFor="jurusan">
              Jurusan <span className="text-red-500">*</span>
            </Label>
            <select
              id="jurusan"
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            >
              {jurusanList.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (Opsional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Cth: machine-learning"
                disabled={loading || tags.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={loading || tags.length >= 5}
                variant="outline"
              >
                Tambah
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
