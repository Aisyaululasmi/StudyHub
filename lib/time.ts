export function timeAgo(date: string | Date): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  const intervals = {
    tahun: 31536000,
    bulan: 2592000,
    minggu: 604800,
    hari: 86400,
    jam: 3600,
    menit: 60,
    detik: 1,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? '' : ''} yang lalu`
    }
  }

  return 'baru saja'
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
