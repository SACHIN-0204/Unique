// Reusable skeleton primitives
export function SkeletonBox({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-start">
        <SkeletonBox className="h-5 w-28" />
        <SkeletonBox className="h-5 w-12 rounded-full" />
      </div>
      <SkeletonBox className="h-4 w-20" />
      <div className="flex justify-between mt-2">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-16" />
      </div>
      <SkeletonBox className="h-2 w-full rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="bg-gray-200 animate-pulse h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBox key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card">
      <SkeletonBox className="h-5 w-48 mb-4" />
      <div className="flex items-end gap-2 h-52">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBox key={i}
            className="flex-1 rounded-lg"
            style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPI({ count = 3 }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card text-center space-y-2">
          <SkeletonBox className="h-8 w-16 mx-auto" />
          <SkeletonBox className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}