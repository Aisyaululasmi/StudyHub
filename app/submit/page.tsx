'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Upload, X, Link as LinkIcon, FileText, Hash } from 'lucide-react'
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
  'Teknik Sipil',
  'Teknik Elektro',
  'Farmasi',
  'Keperawatan',
]

const mataKuliahSuggestions = [
  'Pemrograman Dasar',
  'Algoritma dan Struktur Data',
  'Basis Data',
  'Sistem Operasi',
  'Jaringan Komputer',
  'Pemrograman Web',
  'Kalkulus',
  'Statistika',
  'Fisika Dasar',
  'Kimia Dasar',
  'Biologi',
  'Ekonomi Mikro',
  'Ekonomi Makro',
  'Akuntansi Keuangan',
  'Hukum Pidana',
  'Hukum Perdata',
  'Anatomi Tubuh Manusia',
  'Psikologi Umum',
]

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'link' | 'file' | 'text'>('link')
  const [url, setUrl] = useState('')
  const [mataKuliah, setMataKuliah] = useState('')
  const [jurusan, setJurusan] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Suggestions
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Pre-fill jurusan from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('jurusan')
        .eq('id', session.user.id)
        .single()

      if (profile?.jurusan) {
        setJurusan(profile.jurusan)
      }
    }

    getUser()
  }, [router])

  const handleMataKuliahChange = (value: string) => {
    setMataKuliah(value)

    if (value.length > 0) {
      const filtered = mataKuliahSuggestions.filter((mk) =>
        mk.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (selectedFile) {
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Format file harus PDF atau gambar (JPG, PNG)')
        return
      }

      setFile(selectedFile)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const supabase = createBrowserClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { data, error } = await supabase.storage
      .from('post-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-files')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
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

    if (type === 'link' && !url.trim()) {
      toast.error('URL harus diisi')
      return
    }

    if (type === 'file' && !file) {
      toast.error('File harus diupload')
      return
    }

    if (description.length > 500) {
      toast.error('Deskripsi maksimal 500 karakter')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const supabase = createBrowserClient()

      let fileUrl: string | null = null
      let fileName: string | null = null

      // Upload file if type is file
      if (type === 'file' && file) {
        setUploadProgress(30)
        fileUrl = await uploadFile(file)
        fileName = file.name
        setUploadProgress(70)
      }

      setUploadProgress(90)

      // Create post
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          type,
          url: type === 'link' ? url.trim() : null,
          file_url: fileUrl,
          file_name: fileName,
          mata_kuliah: mataKuliah.trim(),
          jurusan,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setUploadProgress(100)

      toast.success('Materi berhasil dibagikan!')

      // Redirect to post detail
      setTimeout(() => {
        router.push(`/post/${post.id}`)
      }, 500)
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat post')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bagikan Materi</h1>
        <p className="text-gray-600">Bantu teman-temanmu dengan berbagi materi kuliah</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
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

        {/* Type */}
        <div>
          <Label>
            Tipe Konten <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <button
              type="button"
              onClick={() => setType('link')}
              disabled={loading}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                type === 'link'
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <LinkIcon className="w-6 h-6" />
              <span className="font-medium">Link</span>
            </button>

            <button
              type="button"
              onClick={() => setType('file')}
              disabled={loading}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                type === 'file'
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Upload className="w-6 h-6" />
              <span className="font-medium">Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => setType('text')}
              disabled={loading}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                type === 'text'
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <FileText className="w-6 h-6" />
              <span className="font-medium">Teks</span>
            </button>
          </div>
        </div>

        {/* URL (conditional) */}
        {type === 'link' && (
          <div>
            <Label htmlFor="url">
              URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              required
            />
          </div>
        )}

        {/* File Upload (conditional) */}
        {type === 'file' && (
          <div>
            <Label htmlFor="file">
              File <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Klik untuk upload atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF atau gambar (JPG, PNG), maksimal 10MB
                  </p>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="inline-block mt-4 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[#1d4ed8] transition-colors"
                  >
                    Pilih File
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">{description.length}/500 karakter</p>
        </div>

        {/* Mata Kuliah */}
        <div className="relative">
          <Label htmlFor="mata_kuliah">
            Mata Kuliah <span className="text-red-500">*</span>
          </Label>
          <Input
            id="mata_kuliah"
            value={mataKuliah}
            onChange={(e) => handleMataKuliahChange(e.target.value)}
            placeholder="Cth: Basis Data"
            disabled={loading}
            autoComplete="off"
            required
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setMataKuliah(suggestion)
                    setShowSuggestions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
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
            <option value="">Pilih Jurusan</option>
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
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                className="pl-10"
              />
            </div>
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
          <p className="mt-1 text-xs text-gray-500">
            {tags.length}/5 tags (tekan Enter untuk menambah)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress > 0 ? `Mengupload... ${uploadProgress}%` : 'Membuat post...'}
              </>
            ) : (
              'Bagikan Materi'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
