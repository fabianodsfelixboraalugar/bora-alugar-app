
import React, { useState } from 'react';
import { UserPlan, UserType } from '../types';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  currentPlan: UserPlan;
  itemCount: number;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ currentPlan, itemCount, onClose }) => {
  const { user, confirmarPagamento } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async (valor: number) => {
    setIsProcessing(true);
    // Simulação de gateway de pagamento
    setTimeout(async () => {
        await confirmarPagamento(valor);
        setIsProcessing(false);
        onClose();
    }, 1500);
  };

  const isFree = currentPlan === UserPlan.FREE;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col md:flex-row transform transition-all max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Lado Esquerdo: Hero/Contexto */}
        <div className="w-full md:w-1/3 bg-brand-600 p-10 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                    <i className="fas fa-rocket text-2xl"></i>
                </div>
                <h3 className="text-3xl font-black mb-4 leading-tight uppercase tracking-tighter">Alcance mais pessoas</h3>
                <p className="text-brand-50 text-sm font-medium leading-relaxed">
                    Você atingiu o limite de <span className="font-black">1 anúncio ativo</span> do plano gratuito. 
                    Escolha o plano ideal para continuar crescendo.
                </p>
                
                <div className="mt-10 pt-10 border-t border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Sua conta atual</p>
                    <p className="text-lg font-bold">{currentPlan}</p>
                </div>
            </div>
        </div>

        {/* Lado Direito: Planos */}
        <div className="flex-1 p-8 md:p-12 bg-white">
            <div className="flex justify-between items-center mb-10">
                <h4 className="font-black text-gray-900 text-2xl tracking-tighter uppercase">Escolha seu Nível</h4>
                <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Plano Individual (PF) */}
                <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative flex flex-col ${user?.userType === UserType.PF ? 'border-brand-500 bg-brand-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                    {user?.userType === UserType.PF && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md">Recomendado</span>
                    )}
                    <div className="mb-6">
                        <h5 className="font-black text-gray-900 text-lg uppercase tracking-tight">Plano Individual</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ideal para Pessoa Física</p>
                    </div>
                    
                    <div className="mb-8">
                        <span className="text-3xl font-black text-gray-900">R$ 9,99</span>
                        <span className="text-xs text-gray-400 font-bold uppercase ml-1">/mês</span>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-brand-500"></i> Até 5 anúncios ativos
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-brand-500"></i> Visibilidade Padrão
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-brand-500"></i> Chat ilimitado
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-brand-500"></i> Estatísticas básicas
                        </li>
                    </ul>

                    <button 
                        disabled={isProcessing}
                        onClick={() => handlePay(9.99)}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-100 transition transform active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'Assinar Individual'}
                    </button>
                </div>

                {/* Plano Empresarial (PJ) */}
                <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative flex flex-col ${user?.userType === UserType.PJ ? 'border-secondary-500 bg-secondary-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
                    {user?.userType === UserType.PJ && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md">Recomendado</span>
                    )}
                    <div className="mb-6">
                        <h5 className="font-black text-gray-900 text-lg uppercase tracking-tight">Plano Empresarial</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Foco em Locadoras (PJ)</p>
                    </div>
                    
                    <div className="mb-8">
                        <span className="text-3xl font-black text-gray-900">R$ 49,99</span>
                        <span className="text-xs text-gray-400 font-bold uppercase ml-1">/mês</span>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-secondary-500"></i> Anúncios Ilimitados
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-secondary-500"></i> Destaque nas buscas
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-secondary-500"></i> Selo Empresa Verificada
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-secondary-500"></i> Dashboard Inteligente
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-gray-600">
                            <i className="fas fa-check text-secondary-500"></i> Suporte Prioritário
                        </li>
                    </ul>

                    <button 
                        disabled={isProcessing}
                        onClick={() => handlePay(49.99)}
                        className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary-100 transition transform active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'Assinar Empresarial'}
                    </button>
                </div>
            </div>

            <p className="mt-10 text-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Pagamento recorrente mensal. Você pode cancelar a qualquer momento no painel.
            </p>
        </div>
      </div>
    </div>
  );
};
