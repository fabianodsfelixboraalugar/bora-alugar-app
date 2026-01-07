
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificação robusta do estado de consentimento
    const checkConsent = () => {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent || consent === 'null' || consent === 'undefined') {
        setIsVisible(true);
      }
    };

    // Pequeno delay para garantir que a renderização inicial não bloqueie a visualização
    const timer = setTimeout(checkConsent, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = (all: boolean) => {
    localStorage.setItem('cookie_consent', all ? 'all' : 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:right-8 md:left-auto md:w-[400px] z-[500] p-4 animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] p-8 border border-gray-100 flex flex-col gap-6 ring-1 ring-black/5">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 flex-shrink-0 border border-brand-100 shadow-sm">
            <i className="fas fa-cookie-bite text-2xl"></i>
          </div>
          <div>
            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight leading-tight">Privacidade & Cookies</h4>
            <p className="text-[11px] text-gray-500 mt-1.5 font-bold leading-relaxed">
              Utilizamos tecnologias para melhorar sua segurança e experiência. Escolha o que deseja permitir navegar.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => handleAccept(true)}
            className="w-full bg-[#58B83F] hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95 uppercase text-xs tracking-widest"
          >
            Aceitar Todos
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleAccept(false)}
              className="bg-gray-50 hover:bg-gray-100 text-gray-500 font-black py-3.5 rounded-2xl border border-gray-200 transition text-[9px] uppercase tracking-wider"
            >
              Só Essenciais
            </button>
            <Link 
              to="/cookies" 
              onClick={() => setIsVisible(false)}
              className="flex items-center justify-center bg-white hover:bg-gray-50 text-brand-600 font-black py-3.5 rounded-2xl border border-brand-100 transition text-[9px] uppercase tracking-wider"
            >
              Configurar
            </Link>
          </div>
        </div>

        <div className="pt-2 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
              Ao aceitar, você concorda com nossa <Link to="/privacidade" className="text-brand-600 underline">Política de Dados</Link>.
            </p>
        </div>
      </div>
    </div>
  );
};
