import React, { useState, useEffect } from 'react';

export const InstallPwaNotification: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      // Show prompt only if not dismissed before
      if (!localStorage.getItem('pwa_dismissed')) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("transitionend", handler);
  }, []);

  const onClick = (evt: any) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
            setIsVisible(false);
        }
    });
  };

  const onDismiss = () => {
      setIsVisible(false);
      localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!supportsPWA || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-xl shadow-2xl p-4 border border-brand-100 z-[100] animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="bg-brand-100 p-3 rounded-lg text-brand-600">
            <i className="fas fa-mobile-alt text-xl"></i>
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">Instalar Aplicativo</h4>
            <p className="text-xs text-gray-600 mt-1">
                Adicione o AlugaTudo à sua tela inicial para uma experiência melhor e mais rápida.
            </p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
        </button>
      </div>
      <button 
        onClick={onClick}
        className="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-2 rounded-lg transition"
      >
        Instalar Agora
      </button>
    </div>
  );
};