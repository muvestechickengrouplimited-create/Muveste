import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="hidden md:block w-full space-y-8 pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Stats row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 h-96 bg-gray-200 rounded-2xl"></div>
        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );
}
