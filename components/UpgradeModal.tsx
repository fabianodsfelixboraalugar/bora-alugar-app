
import React, { useState } from 'react';
import { UserPlan } from '../types';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  currentPlan: UserPlan;
  itemCount: number;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ currentPlan, itemCount, onClose }) => {
  const { confirmarPagamento } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async (valor: number) => {
    setIsProcessing(true);
    await confirmarPagamento(valor);
    setIsProcessing(false);
    onClose();
  };

  const isFree = currentPlan === UserPlan.FREE;
  const isBasic = currentPlan === UserPlan.BASIC;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col transform transition-all">
        {/* Header Visual */}
        <div className="bg-brand-600 p-8 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                    <i className="fas fa-rocket text-2xl"></i>
                </div>
                <h3 className="text-2xl font-black mb-1">Limite Atingido!</h3>
                <p className="text-brand-100 text-sm font-medium">Você atingiu o limite do seu plano atual.</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-8">
            <div className="text-center mb-8">
                <p className="text-gray-500 text-sm mb-4">
                    Sua conta <strong>{currentPlan}</strong> permite até {isFree ? '2' : '10'} anúncios ativos. 
                    Você já possui <strong>{itemCount}</strong>.
                </p>
                <h4 className="font-black text-gray-900 text-xl tracking-tight">Escolha seu novo nível:</h4>
            </div>

            <div className="space-y-4">
                {/* Opção Plano Básico (Apenas para Free) */}
                {isFree && (
                    <div className="p-5 border-2 border-brand-100 rounded-2xl bg-brand-50/30 flex justify-between items-center group hover:border-brand-500 transition-colors">
                        <div>
                            <h5 className="font-black text-brand-900">Plano Básico</h5>
                            <p className="text-xs text-brand-700 font-bold uppercase tracking-widest">Até 10 Itens</p>
                        </div>
                        <button 
                            disabled={isProcessing}
                            onClick={() => handlePay(9.99)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md transition disabled:opacity-50"
                        >
                            {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'R$ 9,99'}
                        </button>
                    </div>
                )}

                {/* Opção Plano Premium */}
                {(isFree || isBasic) && (
                    <div className="p-5 border-2 border-secondary-100 rounded-2xl bg-secondary-50/20 flex justify-between items-center group hover:border-secondary-500 transition-colors">
                        <div>
                            <h5 className="font-black text-secondary-600">Plano Premium</h5>
                            <p className="text-xs text-secondary-500 font-bold uppercase tracking-widest">Itens Ilimitados</p>
                        </div>
                        <button 
                            disabled={isProcessing}
                            onClick={() => handlePay(29.99)}
                            className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md transition disabled:opacity-50"
                        >
                            {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'R$ 29,99'}
                        </button>
                    </div>
                )}
            </div>

            <button 
                onClick={onClose}
                className="w-full mt-8 py-3 text-xs font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-widest"
            >
                Continuar gerenciando atuais
            </button>
        </div>
      </div>
    </div>
  );
};
