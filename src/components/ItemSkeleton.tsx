
import React from 'react';

export const ItemSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-gray-200"></div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
        <div className="flex items-center gap-1 mt-1">
          <div className="h-3 bg-gray-200 rounded-full w-4"></div>
          <div className="h-3 bg-gray-200 rounded-md w-12"></div>
        </div>
        <div className="mt-auto space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded-md w-24"></div>
            <div className="h-4 bg-gray-200 rounded-md w-12"></div>
          </div>
          <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
};
