export default function FeedSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Post Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-28 bg-gray-200 rounded" />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
