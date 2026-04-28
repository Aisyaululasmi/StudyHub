'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const jurusanList = [
  'Semua',
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

const typeList = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'link', label: 'Link' },
  { value: 'file', label: 'File' },
  { value: 'text', label: 'Teks' },
]

const sortList = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'most_upvotes', label: 'Terpopuler' },
  { value: 'most_comments', label: 'Paling Banyak Komentar' },
  { value: 'oldest', label: 'Terlama' },
]

interface FilterBarProps {
  resultCount?: number
}

export default function FilterBar({ resultCount }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jurusan, setJurusan] = useState(searchParams.get('jurusan') || 'Semua')
  const [mataKuliah, setMataKuliah] = useState(searchParams.get('mata_kuliah') || '')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setJurusan(searchParams.get('jurusan') || 'Semua')
    setMataKuliah(searchParams.get('mata_kuliah') || '')
    setType(searchParams.get('type') || 'all')
    setSort(searchParams.get('sort') || 'newest')
  }, [searchParams])

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || value === 'Semua') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    router.push(`/feed${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  const handleJurusanChange = (value: string) => {
    setJurusan(value)
    updateParams({ jurusan: value === 'Semua' ? null : value })
  }

  const handleMataKuliahChange = (value: string) => {
    setMataKuliah(value)
    updateParams({ mata_kuliah: value || null })
  }

  const handleTypeChange = (value: string) => {
    setType(value)
    updateParams({ type: value === 'all' ? null : value })
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    updateParams({ sort: value })
  }

  const clearFilters = () => {
    setJurusan('Semua')
    setMataKuliah('')
    setType('all')
    router.push('/feed')
  }

  const hasActiveFilters =
    jurusan !== 'Semua' || mataKuliah || type !== 'all' || sort !== 'newest'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filter</h2>
          {resultCount !== undefined && (
            <span className="text-sm text-gray-500">
              ({resultCount} hasil)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Hapus Filter
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={cn(
          'grid gap-4',
          showFilters ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'
        )}
      >
        {/* Jurusan */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Jurusan</label>
          <select
            value={jurusan}
            onChange={(e) => handleJurusanChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          >
            {jurusanList.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Mata Kuliah */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Mata Kuliah</label>
          <input
            type="text"
            value={mataKuliah}
            onChange={(e) => handleMataKuliahChange(e.target.value)}
            placeholder="Cth: Kalkulus"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Tipe</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          >
            {typeList.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Urutkan</label>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          >
            {sortList.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
