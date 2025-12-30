
import React from 'react';

export const Logo: React.FC<{ className?: string, hideText?: boolean }> = ({ className = "h-12", hideText = false }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Location Pin Shape inspired by new logo */}
        <path d="M50 95C50 95 90 65 90 35C90 12.9086 72.0914 -5 50 -5C27.9086 -5 10 12.9086 10 35C10 65 50 95 50 95Z" fill="#84cc16" transform="translate(0, 5)"/>
        {/* Inner Circle for Checkmark */}
        <circle cx="50" cy="40" r="22" fill="#4d7c0f" />
        {/* Checkmark */}
        <path d="M38 40L46 48L62 32" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {!hideText && (
        <div className="flex flex-col justify-center">
          <span className="font-black text-2xl text-[#1a2e21] tracking-tighter uppercase leading-none">
            Bora
          </span>
          <span className="font-black text-2xl text-brand-500 tracking-tighter uppercase leading-none -mt-1">
            Alugar
          </span>
        </div>
      )}
    </div>
  );
};
