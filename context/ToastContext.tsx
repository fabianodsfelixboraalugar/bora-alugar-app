
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <i className="fas fa-check-circle"></i>;
      case 'error': return <i className="fas fa-exclamation-circle"></i>;
      case 'warning': return <i className="fas fa-exclamation-triangle"></i>;
      default: return <i className="fas fa-info-circle"></i>;
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-600 border-green-500 shadow-green-100';
      case 'error': return 'bg-red-600 border-red-500 shadow-red-100';
      case 'warning': return 'bg-orange-500 border-orange-400 shadow-orange-100';
      default: return 'bg-gray-800 border-gray-700 shadow-gray-100';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getColor(toast.type)} pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-2xl border animate-fadeIn min-w-[300px] max-w-md`}
          >
            <span className="text-xl opacity-80">{getIcon(toast.type)}</span>
            <span className="flex-1 leading-tight">{toast.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-2 hover:opacity-50 transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
