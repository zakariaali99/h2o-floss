export function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-6">
      <div className="mb-6 h-4 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="aspect-square rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex flex-col space-y-4 lg:col-span-6">
          <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-16 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-14 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
          <div className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  )
}
