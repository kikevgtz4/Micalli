// frontend/src/components/roommates/ProfileSkeleton.tsx
export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-stone-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-stone-200 rounded w-2/3"></div>
      </div>
      
      {/* Form sections skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mb-6 p-6 bg-white rounded-xl">
          <div className="h-6 bg-stone-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-stone-200 rounded"></div>
            <div className="h-10 bg-stone-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}