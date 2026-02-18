import React from 'react';
import { TrustStats } from '../types';

interface TrustBadgeProps {
  stats?: TrustStats;
  showScore?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ stats, showScore = false }) => {
  if (!stats) return null;

  let color = 'bg-gray-100 text-gray-700';
  let icon = 'fa-user';
  let label = 'Novo Usuário';

  if (stats.score < 40) {
    color = 'bg-red-100 text-red-800 border-red-200';
    icon = 'fa-exclamation-triangle';
    label = 'Perfil em Análise';
  } else if (stats.score >= 40 && stats.score < 70) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = 'fa-check-circle';
    label = 'Membro Verificado';
  } else if (stats.score >= 70) {
    color = 'bg-green-50 text-green-700 border-green-200';
    icon = 'fa-shield-alt';
    label = 'Super Confiável';
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
        <i className={`fas ${icon}`}></i>
        <span>{label}</span>
        {showScore && <span className="ml-1 opacity-75">({stats.score})</span>}
      </div>
      {showScore && (
         <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
                className={`h-1.5 rounded-full ${stats.score >= 70 ? 'bg-green-500' : stats.score >= 40 ? 'bg-blue-500' : 'bg-red-500'}`} 
                style={{ width: `${stats.score}%` }}
            ></div>
         </div>
      )}
    </div>
  );
};