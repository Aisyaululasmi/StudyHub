'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Debounce function
  const debounce = useCallback(
    (func: (...args: any[]) => void, delay: number) => {
      let timeoutId: NodeJS.Timeout
      return (...args: any[]) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
      }
    },
    []
  )

  // Update URL with debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }

      // Remove page param when searching
      params.delete('offset')

      const queryString = params.toString()
      router.push(`/feed${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }, 300),
    [searchParams, router, debounce]
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const handleClear = () => {
    setQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/feed${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari materi, mata kuliah, atau jurusan..."
          className={cn(
            'w-full pl-12 pr-12 py-3',
            'text-base border border-gray-300 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent',
            'placeholder:text-gray-400'
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {searchParams.get('q') && (
        <div className="mt-2 text-sm text-gray-600">
          Menampilkan hasil pencarian untuk: <strong className="text-[#2563EB]">{searchParams.get('q')}</strong>
        </div>
      )}
    </div>
  )
}
