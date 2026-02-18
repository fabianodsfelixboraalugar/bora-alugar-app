
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label?: string;
  className?: string;
  confirmMessage?: string;
  hasUnsavedChanges?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  label = 'Voltar', 
  className = '', 
  confirmMessage, 
  hasUnsavedChanges = false 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (hasUnsavedChanges && confirmMessage) {
      if (!window.confirm(confirmMessage)) return;
    }
    // Usar o router navigation para melhor experiência em SPAs
    navigate(-1);
  };

  return (
    <button 
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-all font-bold py-2.5 px-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-brand-200 hover:bg-gray-50 active:scale-95 group ${className}`}
      aria-label="Voltar para a página anterior"
    >
      <i className="fas fa-arrow-left text-sm"></i>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </button>
  );
};
