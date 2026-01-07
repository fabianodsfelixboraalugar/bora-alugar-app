import React from 'react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  max = 5, 
  size = 'md', 
  interactive = false, 
  onChange,
  className = ''
}) => {
  const stars = [];
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-2xl'
  };

  for (let i = 1; i <= max; i++) {
    const filled = i <= Math.round(rating);
    const isClickable = interactive && onChange;
    
    stars.push(
      <i 
        key={i}
        className={`fas fa-star ${sizeClasses[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'} ${isClickable ? 'cursor-pointer hover:text-yellow-500 transition' : ''}`}
        onClick={() => isClickable && onChange(i)}
      ></i>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {stars}
    </div>
  );
};