
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export const VerificationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { submitKYC } = useAuth();
  const [step, setStep] = useState(1);
  const [doc, setDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    if (!doc || !selfie) return;
    setLoading(true);
    await submitKYC(doc, selfie);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn border border-brand-100">
        <div className="bg-brand-500 p-6 text-white text-center">
          <h2 className="text-xl font-black uppercase tracking-tight">Verificação de Confiança</h2>
          <p className="text-xs opacity-90">Proteja-se e desbloqueie anúncios ilimitados</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto border-2 border-brand-100">
                <i className="fas fa-address-card text-brand-600 text-3xl"></i>
              </div>
              <h3 className="font-bold text-gray-800">1. Foto do Documento (RG/CNH)</h3>
              <div className="relative group">
                <div className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${doc ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
                  {doc ? (
                    <img src={doc} className="w-full h-full object-cover rounded-2xl" alt="Doc" />
                  ) : (
                    <>
                      <i className="fas fa-camera text-gray-300 text-2xl mb-2"></i>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Clique para escanear</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={e => handleUpload(e, setDoc)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button disabled={!doc} onClick={() => setStep(2)} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition disabled:opacity-50 uppercase text-xs tracking-widest">
                Próximo Passo
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto border-2 border-brand-100">
                <i className="fas fa-smile text-brand-600 text-3xl"></i>
              </div>
              <h3 className="font-bold text-gray-800">2. Selfie em Tempo Real</h3>
              <div className="relative">
                <div className={`aspect-square max-w-[200px] mx-auto rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all ${selfie ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
                  {selfie ? (
                    <img src={selfie} className="w-full h-full object-cover rounded-full" alt="Selfie" />
                  ) : (
                    <i className="fas fa-user-circle text-gray-300 text-4xl"></i>
                  )}
                </div>
                <input type="file" accept="image/*" capture="user" onChange={e => handleUpload(e, setSelfie)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-xs uppercase">Voltar</button>
                <button disabled={!selfie || loading} onClick={handleFinish} className="flex-[2] bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition uppercase text-xs tracking-widest">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Finalizar'}
                </button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full py-4 text-[10px] font-bold text-gray-300 hover:text-gray-500 transition uppercase border-t border-gray-50">Cancelar Processo</button>
      </div>
    </div>
  );
};
