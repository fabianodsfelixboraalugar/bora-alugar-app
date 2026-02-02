
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { RentalStatus, VerificationStatus, Rental, Item, User, UserType, ItemStatus, UserPlan } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';
import { EditProfileModal } from '../components/EditProfileModal';
import { VerificationModal } from '../components/VerificationModal';
import { ReviewModal } from '../components/ReviewModal';
import { PjDashboardView } from '../components/PjDashboardView';
import { UpgradeModal } from '../components/UpgradeModal';

export const Dashboard: React.FC = () => {
  const { user, updateUser, cancelarAssinatura } = useAuth();
  const { items, rentals, getRentalsByUserId, getRentalsByOwnerId, updateRentalStatus, removeItem, updateItem, getReviewByTransaction, submitReview } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'rentals' | 'listings' | 'requests' | 'analytics' | 'subscription'>('rentals');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [reviewingRental, setReviewingRental] = useState<Rental | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const isPj = user?.userType === UserType.PJ;

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const myRentals = getRentalsByUserId(user.id);
  const myItems = items.filter(i => i.ownerId === user.id);
  const incomingRequests = getRentalsByOwnerId(user.id);
  const pendingRequestsOwnerCount = incomingRequests.filter(r => r.status === RentalStatus.PENDING).length;

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case RentalStatus.CONFIRMED: return 'bg-blue-100 text-blue-700';
      case RentalStatus.SHIPPED: return 'bg-purple-100 text-purple-700';
      case RentalStatus.DELIVERED: return 'bg-indigo-100 text-indigo-700';
      case RentalStatus.ACTIVE: return 'bg-green-100 text-green-700';
      case RentalStatus.COMPLETED: return 'bg-gray-100 text-gray-700';
      case RentalStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAction = (rentalId: string, nextStatus: RentalStatus) => {
    updateRentalStatus(rentalId, nextStatus);
    setSuccessToast(`Status atualizado para: ${nextStatus.toUpperCase()}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleAvailability = (item: Item) => {
    const nextState = !item.available;
    const nextStatus = nextState ? ItemStatus.AVAILABLE : ItemStatus.MAINTENANCE;
    updateItem(item.id, { available: nextState, status: nextStatus });
    setSuccessToast(`Item agora está ${nextState ? 'VISÍVEL' : 'OCULTO'}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSaveProfile = (data: Partial<User>) => {
    updateUser(data);
    setIsEditModalOpen(false);
    setSuccessToast("Perfil atualizado!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen relative bg-gray-50/20">
      {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
      {showUpgradeModal && <UpgradeModal currentPlan={user.plan} itemCount={myItems.length} onClose={() => setShowUpgradeModal(false)} />}
      
      {reviewingRental && (
        <ReviewModal 
          rental={reviewingRental} 
          currentUser={user} 
          onClose={() => setReviewingRental(null)} 
          onSubmit={async (data) => {
              await submitReview(data);
              setReviewingRental(null);
              setSuccessToast("Avaliação enviada!");
              setTimeout(() => setSuccessToast(null), 3000);
          }}
        />
      )}

      {successToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-fadeIn flex items-center gap-3 border border-white/10">
          <i className="fas fa-check-circle text-brand-500"></i>
          <span className="text-xs font-bold uppercase tracking-widest">{successToast}</span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between"><BackButton label="Início" /></div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Esquerda - Perfil e Identidade */}
        <div className="w-full md:w-1/4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg overflow-hidden bg-gray-50 mb-4">
              <img src={user.avatar || "https://i.pravatar.cc/150"} alt="P" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1 leading-tight">{user.name}</h2>
            <p className="text-xs text-gray-500 font-bold mb-3">{user.bio || 'Locatário Bora Alugar'}</p>
            
            <div className="flex justify-center mb-4">
              <TrustBadge stats={user.trustStats} showScore={true} />
            </div>

            <div className="pt-4 border-t border-gray-50 mb-6">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{user.userType.toUpperCase()}</p>
            </div>

            <button onClick={() => setIsEditModalOpen(true)} className="w-full py-4 bg-white border border-gray-100 text-brand-600 rounded-2xl hover:bg-brand-50 transition font-black text-xs uppercase tracking-widest shadow-sm">Editar Perfil</button>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
             <div className="flex flex-col items-center gap-2 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${user.verified ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    <i className={`fas ${user.verified ? 'fa-shield-check' : 'fa-id-card'} text-xl`}></i>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Identidade</p>
                    <p className="text-xs font-black text-gray-800 uppercase">{user.verificationStatus}</p>
                </div>
             </div>
             {!user.verified && user.verificationStatus !== VerificationStatus.PENDING && (
                <button 
                    onClick={() => setShowVerificationModal(true)}
                    className="w-full py-4 bg-[#84cc16] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition shadow-lg shadow-brand-100"
                >
                    Validar Documentos
                </button>
             )}
             {user.verificationStatus === VerificationStatus.PENDING && (
                <div className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase text-center border border-blue-100">
                    Em análise
                </div>
             )}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano Atual</p>
                <span className="text-[9px] font-black px-3 py-1 rounded-lg uppercase bg-gray-100 text-gray-500">{user.plan.toUpperCase()}</span>
             </div>
             <p className="text-xs font-bold text-gray-800 mb-6">Você está usando {myItems.length} de {user.plan === UserPlan.FREE ? '1' : user.plan === UserPlan.BASIC ? '5' : '∞'} anúncios.</p>
             <button onClick={() => setActiveTab('subscription')} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition border border-gray-100">Configurações</button>
          </div>
        </div>

        {/* Conteúdo Principal - Tabs */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
            <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
              {isPj && (
                <button onClick={() => setActiveTab('analytics')} className={`flex-1 min-w-[150px] py-6 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'text-brand-600 border-b-4 border-brand-500 bg-brand-50/10' : 'text-gray-400'}`}>
                  <i className="fas fa-chart-pie"></i> Intelligence
                </button>
              )}
              <button onClick={() => setActiveTab('rentals')} className={`flex-1 min-w-[150px] py-6 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'rentals' ? 'text-brand-600 border-b-4 border-brand-500 bg-brand-50/10' : 'text-gray-400'}`}>
                Meus Aluguéis
              </button>
              <button onClick={() => setActiveTab('requests')} className={`flex-1 min-w-[150px] py-6 text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'requests' ? 'text-brand-600 border-b-4 border-brand-500 bg-brand-50/10' : 'text-gray-400'}`}>
                Solicitações
                {pendingRequestsOwnerCount > 0 && <span className="ml-2 bg-red-500 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full animate-pulse">{pendingRequestsOwnerCount}</span>}
              </button>
              <button onClick={() => setActiveTab('listings')} className={`flex-1 min-w-[150px] py-6 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'listings' ? 'text-brand-600 border-b-4 border-brand-500 bg-brand-50/10' : 'text-gray-400'}`}>Frota de Itens</button>
              <button onClick={() => setActiveTab('subscription')} className={`flex-1 min-w-[150px] py-6 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'subscription' ? 'text-brand-600 border-b-4 border-brand-500 bg-brand-50/10' : 'text-gray-400'}`}>Assinatura</button>
            </div>

            <div className="p-10">
              {activeTab === 'analytics' && isPj && <PjDashboardView user={user} items={myItems} rentals={incomingRequests} />}

              {/* Meus Aluguéis (Visão Locatário) */}
              {activeTab === 'rentals' && (
                <div className="space-y-6 animate-fadeIn">
                  {myRentals.length === 0 ? <p className="text-center py-20 text-gray-300 font-black uppercase tracking-widest text-xs italic">Nenhuma reserva ativa.</p> :
                  myRentals.map(r => {
                    const reviewDone = !!getReviewByTransaction(r.id, user.id);
                    return (
                      <div key={r.id} className="p-6 border border-gray-100 rounded-3xl bg-gray-50/30 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex items-center gap-5 flex-1">
                           <img src={r.itemImage} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt="" />
                           <div>
                              <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">{r.itemTitle}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${getStatusColor(r.status)}`}>{r.status}</span>
                                <p className="text-sm font-black text-brand-600">R$ {r.totalPrice}</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          {r.status === RentalStatus.SHIPPED && (
                            <button onClick={() => handleAction(r.id, RentalStatus.DELIVERED)} className="flex-1 md:flex-none bg-brand-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Confirmar Recebimento</button>
                          )}
                          {r.status === RentalStatus.COMPLETED && !reviewDone && (
                             <button onClick={() => setReviewingRental(r)} className="flex-1 md:flex-none bg-yellow-400 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Avaliar Experiência</button>
                          )}
                          <button onClick={() => navigate(`/chat?with=${r.ownerId}&item=${r.itemId}`)} className="p-3 bg-white text-gray-400 rounded-xl hover:text-brand-600 transition border border-gray-100 shadow-sm"><i className="fas fa-comment-dots text-lg"></i></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Solicitações (Visão Proprietário) */}
              {activeTab === 'requests' && (
                <div className="space-y-6 animate-fadeIn">
                   {incomingRequests.length === 0 ? <p className="text-center py-20 text-gray-300 font-black uppercase tracking-widest text-xs italic">Nenhuma solicitação recebida.</p> :
                   incomingRequests.map(r => {
                     const reviewDone = !!getReviewByTransaction(r.id, user.id);
                     return (
                      <div key={r.id} className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm flex flex-col md:flex-row gap-6 items-center">
                          <div className="flex items-center gap-5 flex-1">
                             <img src={r.itemImage} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt="" />
                             <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">{r.itemTitle}</h4>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Solicitado por {r.renterId}</p>
                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${getStatusColor(r.status)}`}>{r.status}</span>
                             </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                             {r.status === RentalStatus.PENDING && (
                               <>
                                  <button onClick={() => updateRentalStatus(r.id, RentalStatus.CANCELLED)} className="flex-1 py-3 bg-red-50 text-red-500 font-black rounded-xl text-[10px] uppercase border border-red-100">Recusar</button>
                                  <button onClick={() => updateRentalStatus(r.id, RentalStatus.CONFIRMED)} className="flex-[2] py-3 bg-brand-500 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-brand-100">Confirmar</button>
                               </>
                             )}
                             {r.status === RentalStatus.CONFIRMED && (
                                <button onClick={() => handleAction(r.id, RentalStatus.ACTIVE)} className="flex-1 bg-brand-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Entregar Item</button>
                             )}
                             {r.status === RentalStatus.ACTIVE && (
                                <button onClick={() => handleAction(r.id, RentalStatus.COMPLETED)} className="flex-1 bg-gray-800 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Receber de Volta</button>
                             )}
                             {r.status === RentalStatus.COMPLETED && !reviewDone && (
                                <button onClick={() => setReviewingRental(r)} className="flex-1 bg-yellow-400 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Avaliar Locatário</button>
                             )}
                             <button onClick={() => navigate(`/chat?with=${r.renterId}`)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-brand-600 transition border border-gray-100"><i className="fas fa-comment text-lg"></i></button>
                          </div>
                      </div>
                     );
                   })}
                </div>
              )}

              {/* Restante das Tabs (Listings, Subscription) mantidas conforme a versão funcional anterior */}
              {activeTab === 'listings' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seu Inventário ({myItems.length} itens)</h3>
                     <button onClick={() => navigate('/add-item')} className="bg-[#84cc16] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition transform active:scale-95">Novo Anúncio</button>
                  </div>
                  {myItems.map(item => (
                    <div key={item.id} className="p-5 border border-gray-100 rounded-[2.5rem] bg-gray-50/30 flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <img src={item.images[0]} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-sm" alt="" />
                        <div>
                           <h4 className="font-bold text-gray-900 text-base leading-tight mb-2">{item.title}</h4>
                           <div className="flex items-center gap-3">
                             <p className={`text-[10px] font-black uppercase ${item.available ? 'text-green-600' : 'text-red-500'}`}>{item.available ? 'Disponível' : 'Oculto'}</p>
                             <p className="text-brand-600 font-black text-xs">R$ {item.pricePerDay}/dia</p>
                           </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleToggleAvailability(item)} title="Alternar Visibilidade" className={`w-10 h-10 rounded-xl border transition flex items-center justify-center ${item.available ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}><i className={`fas ${item.available ? 'fa-eye' : 'fa-eye-slash'}`}></i></button>
                         <button onClick={() => navigate(`/add-item?edit=${item.id}`)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-brand-600 transition flex items-center justify-center shadow-sm"><i className="fas fa-pencil-alt text-sm"></i></button>
                         <button onClick={() => setItemToDelete(item)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center shadow-sm"><i className="fas fa-trash-alt text-sm"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="p-10 rounded-[3rem] bg-gray-50 border border-gray-100 relative overflow-hidden">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Plano {user.plan}</h3>
                        <p className="text-sm text-gray-500 font-medium mb-10">Gerencie sua assinatura e faturamento Bora Alugar.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Capacidade de Anúncios</p>
                                <div className="flex items-baseline justify-between">
                                    <p className="text-3xl font-black text-gray-900">{myItems.length}</p>
                                    <p className="text-xs text-gray-400 font-black uppercase">de {user.plan === UserPlan.FREE ? '1' : user.plan === UserPlan.BASIC ? '5' : 'Ilimitados'}</p>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                  <div className="bg-brand-500 h-full" style={{ width: `${(myItems.length / (user.plan === UserPlan.FREE ? 1 : 5)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status Financeiro</p>
                                <div className="flex items-center gap-2 text-green-600 font-black uppercase text-xs">
                                    <i className="fas fa-check-circle"></i> Renovação Automática {user.planAutoRenew ? 'Ativa' : 'Desativada'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={() => setShowUpgradeModal(true)} className="flex-1 bg-[#84cc16] text-white font-black py-5 rounded-[2rem] shadow-xl transition transform active:scale-95 uppercase text-xs tracking-widest">Alterar Plano</button>
                            {user.plan !== UserPlan.FREE && (
                              <button onClick={() => cancelarAssinatura()} className="flex-1 bg-white text-red-500 border border-red-100 font-black py-5 rounded-[2rem] hover:bg-red-50 transition uppercase text-xs tracking-widest">Cancelar Assinatura</button>
                            )}
                        </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveProfile} />}

      {/* Alerta de Item para Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 text-red-500 shadow-sm border border-red-100">
              <i className="fas fa-trash-alt text-3xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Excluir Anúncio?</h3>
            <p className="text-sm text-gray-400 mb-10 font-bold uppercase leading-relaxed tracking-tighter">
              Deseja remover permanentemente o item <span className="text-gray-900 underline">"{itemToDelete.title}"</span> da plataforma?
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setItemToDelete(null)} className="py-4 bg-gray-100 text-gray-500 font-black rounded-2xl transition uppercase text-xs tracking-widest">Cancelar</button>
              <button onClick={() => { removeItem(itemToDelete.id); setItemToDelete(null); }} className="py-4 bg-red-500 text-white font-black rounded-2xl transition uppercase text-xs tracking-widest shadow-lg shadow-red-100">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
