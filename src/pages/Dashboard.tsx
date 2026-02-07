
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { RentalStatus, VerificationStatus, Rental, Item, User, UserType, ItemStatus } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';
import { EditProfileModal } from '../components/EditProfileModal';
import { VerificationModal } from '../components/VerificationModal';
import { ReviewModal } from '../components/ReviewModal';
import { PjDashboardView } from '../components/PjDashboardView';

export const Dashboard: React.FC = () => {
  const { user, updateUser, getPendingUsers, adminApproveKYC, adminRejectKYC } = useAuth();
  const { items, rentals, getRentalsByUserId, getRentalsByOwnerId, updateRentalStatus, removeItem, updateItem, getReviewByTransaction, submitReview } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'rentals' | 'listings' | 'requests' | 'admin' | 'analytics'>('rentals');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [reviewingRental, setReviewingRental] = useState<Rental | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const [pendingKycUsers, setPendingKycUsers] = useState<User[]>([]);
  const [selectedKycReview, setSelectedKycReview] = useState<User | null>(null);

  const isPj = user?.userType === UserType.PJ;

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    setPendingKycUsers(getPendingUsers());
    
    // Se for PJ e estiver acessando o Dashboard, foca no BI/Analytics por padrão
    if (isPj && activeTab === 'rentals' && !sessionStorage.getItem('dashboard_viewed')) {
        setActiveTab('analytics');
        sessionStorage.setItem('dashboard_viewed', 'true');
    }
  }, [user, navigate, getPendingUsers, isPj, activeTab]);

  if (!user) return null;

  const myRentals = getRentalsByUserId(user.id);
  const myItems = items.filter(i => i.ownerId === user.id);
  const incomingRequests = getRentalsByOwnerId(user.id);
  const pendingRequestsOwnerCount = incomingRequests.filter(r => r.status === RentalStatus.PENDING).length;

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case RentalStatus.CONFIRMED: return 'bg-blue-100 text-blue-700';
      case RentalStatus.ACTIVE: return 'bg-green-100 text-green-700';
      case RentalStatus.COMPLETED: return 'bg-gray-100 text-gray-700';
      case RentalStatus.CANCELLED: return 'bg-red-100 text-red-700';
      case RentalStatus.SHIPPED: return 'bg-purple-100 text-purple-700';
      case RentalStatus.DELIVERED: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApproveKyc = async (userId: string) => {
    await adminApproveKYC(userId);
    setPendingKycUsers(prev => prev.filter(u => u.id !== userId));
    setSelectedKycReview(null);
    setSuccessToast("Usuário validado com sucesso!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRejectKyc = async (userId: string) => {
    await adminRejectKYC(userId);
    setPendingKycUsers(prev => prev.filter(u => u.id !== userId));
    setSelectedKycReview(null);
    setSuccessToast("Verificação reprovada.");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAction = async (id: string, status: RentalStatus) => {
    updateRentalStatus(id, status);
    setSuccessToast(`Status atualizado para: ${status}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete.id);
      setItemToDelete(null);
      setSuccessToast("Anúncio excluído com sucesso!");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleToggleAvailability = (item: Item) => {
    const nextState = !item.available;
    const nextStatus = nextState ? ItemStatus.AVAILABLE : ItemStatus.MAINTENANCE;
    updateItem(item.id, { available: nextState, status: nextStatus });
    setSuccessToast(`Item agora está ${nextState ? 'VISÍVEL' : 'OCULTO'} para aluguel.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const getItemCurrentStatus = (item: Item) => {
    if (item.status === ItemStatus.MAINTENANCE) return 'MANUTENÇÃO';
    
    const now = new Date();
    const activeRental = rentals.find(r => 
      r.itemId === item.id && 
      [RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.SHIPPED, RentalStatus.DELIVERED].includes(r.status) &&
      new Date(r.startDate) <= now && new Date(r.endDate) >= now
    );

    if (activeRental) return 'ALUGADO';
    return item.available ? 'DISPONÍVEL' : 'INDISPONÍVEL';
  };

  const handleReviewSubmit = async (reviewData: any) => {
    await submitReview(reviewData);
    setReviewingRental(null);
    setSuccessToast("Avaliação enviada com sucesso!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSaveProfile = (data: Partial<User>) => {
    updateUser(data);
    setIsEditModalOpen(false);
    setSuccessToast("Perfil atualizado com sucesso!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen relative">
      {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
      
      {reviewingRental && (
        <ReviewModal 
          rental={reviewingRental} 
          currentUser={user} 
          onClose={() => setReviewingRental(null)} 
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
              <i className="fas fa-trash-alt text-3xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Excluir Anúncio?</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              Tem certeza que deseja remover o anúncio <span className="text-gray-900 font-bold">"{itemToDelete.title}"</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => setItemToDelete(null)}
                className="py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition transform active:scale-95 uppercase text-xs tracking-widest"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedKycReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                <div>
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Revisar Identidade</h3>
                   <p className="text-xs text-gray-400 font-bold uppercase">{selectedKycReview.name}</p>
                </div>
                <button onClick={() => setSelectedKycReview(null)} className="text-gray-400 hover:text-gray-600 p-2"><i className="fas fa-times text-xl"></i></button>
             </div>
             <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Documento Oficial</p>
                   <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 border-2 border-brand-100 shadow-inner">
                      <img src={selectedKycReview.documentUrl} className="w-full h-full object-contain" alt="Documento" />
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Selfie do Usuário</p>
                   <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 border-2 border-brand-100 shadow-inner">
                      <img src={selectedKycReview.selfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                   </div>
                </div>
             </div>
             <div className="p-8 border-t border-gray-100 bg-gray-50/50 grid grid-cols-2 gap-4">
                <button onClick={() => handleRejectKyc(selectedKycReview.id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-2xl transition transform active:scale-95 uppercase text-xs tracking-widest border border-red-200">REPROVAR</button>
                <button onClick={() => handleApproveKyc(selectedKycReview.id)} className="bg-[#58B83F] hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase text-xs tracking-widest">APROVAR IDENTIDADE</button>
             </div>
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
            <i className="fas fa-check-circle text-green-400"></i>
            <span className="text-sm font-bold uppercase tracking-tight">{successToast}</span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between"><BackButton label="Início" /></div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4 space-y-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 rounded-[2.5rem] mx-auto border-4 border-white shadow-lg overflow-hidden bg-gray-50 mb-4">
              <img src={user.avatar || "https://i.pravatar.cc/150"} alt="P" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
            <div className="flex justify-center mb-3"><TrustBadge stats={user.trustStats} showScore={true} /></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">{user.userType === UserType.PJ ? 'Empresa Parceira' : user.role}</p>
            <button onClick={() => setIsEditModalOpen(true)} className="w-full py-4 bg-gray-50 border border-brand-50 text-brand-700 rounded-2xl hover:bg-brand-100 transition font-bold text-sm">Editar Perfil</button>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Conta Verificada</h3>
             <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${user.verificationStatus === VerificationStatus.VERIFIED ? 'bg-[#58B83F] text-white' : 'bg-yellow-100 text-yellow-700'}`}>{user.verificationStatus}</span>
             </div>
             {user.verificationStatus !== VerificationStatus.VERIFIED && <button onClick={() => setShowVerificationModal(true)} className="w-full py-3.5 bg-[#58B83F] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md">Iniciar Validação</button>}
          </div>
        </div>

        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
              {isPj && (
                <button onClick={() => setActiveTab('analytics')} className={`flex-1 min-w-[150px] py-5 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/20' : 'text-gray-400 hover:text-gray-600'}`}>
                  <i className="fas fa-chart-pie text-sm"></i> INTELLIGENCE BI
                </button>
              )}
              <button onClick={() => setActiveTab('rentals')} className={`flex-1 min-w-[120px] py-5 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'rentals' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/20' : 'text-gray-400 hover:text-gray-600'}`}>
                LOCAÇÕES
              </button>
              <button onClick={() => setActiveTab('requests')} className={`flex-1 min-w-[120px] py-5 text-[10px] font-black uppercase tracking-widest transition relative flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/10' : 'text-gray-400 hover:text-gray-600'}`}>
                SOLICITAÇÕES
                {pendingRequestsOwnerCount > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-black h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                        {pendingRequestsOwnerCount}
                    </span>
                )}
              </button>
              <button onClick={() => setActiveTab('listings')} className={`flex-1 min-w-[120px] py-5 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'listings' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/20' : 'text-gray-400 hover:text-gray-600'}`}>FROTA DE ITENS</button>
              {user.role === 'ADMIN' && (
                <button onClick={() => setActiveTab('admin')} className={`flex-1 min-w-[120px] py-5 text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'admin' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/20' : 'text-gray-400 hover:text-gray-600'}`}>
                  MODERAÇÃO
                  {pendingKycUsers.length > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white w-2.5 h-2.5 rounded-full animate-pulse"></span>}
                </button>
              )}
            </div>

            <div className="p-8">
              {activeTab === 'analytics' && isPj && (
                <PjDashboardView user={user} items={myItems} rentals={incomingRequests} />
              )}

              {activeTab === 'rentals' && (
                <div className="space-y-4 animate-fadeIn">
                  {myRentals.length === 0 ? <p className="text-center py-20 text-gray-400 italic font-bold uppercase tracking-widest">Nenhuma reserva ativa.</p> :
                  myRentals.map(r => {
                    const alreadyReviewed = getReviewByTransaction(r.id, user.id);
                    return (
                      <div key={r.id} className="p-6 border border-gray-100 rounded-3xl bg-gray-50/30 flex flex-col gap-4 hover:bg-white hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <img src={r.itemImage} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                             <div>
                                <h4 className="font-bold text-gray-900 leading-none mb-1.5">{r.itemTitle}</h4>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getStatusColor(r.status)}`}>{r.status}</span>
                                <p className="text-[10px] text-gray-400 mt-1 font-bold">Início: {new Date(r.startDate).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-brand-600">R$ {r.totalPrice}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          {r.status === RentalStatus.COMPLETED && !alreadyReviewed && (
                            <button 
                              onClick={() => setReviewingRental(r)} 
                              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition"
                            >
                              <i className="fas fa-star mr-2"></i> Avaliar Experiência
                            </button>
                          )}
                          <button onClick={() => navigate(`/chat?with=${r.ownerId}&item=${r.itemId}`)} className="flex-1 bg-brand-50 text-brand-600 text-[10px] font-black uppercase px-4 py-3 rounded-xl hover:bg-brand-500 hover:text-white transition">Chat com Proprietário</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-4 animate-fadeIn">
                  {incomingRequests.length === 0 ? <p className="text-center py-20 text-gray-400 italic font-bold uppercase tracking-widest">Nenhuma solicitação recebida.</p> :
                  incomingRequests.map(r => {
                    const alreadyReviewed = getReviewByTransaction(r.id, user.id);
                    return (
                      <div key={r.id} className="p-6 border border-gray-100 rounded-[2.5rem] bg-gray-50/30 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <img src={r.itemImage} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                                  <div>
                                      <h4 className="font-bold text-gray-900 leading-none mb-1.5">{r.itemTitle}</h4>
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getStatusColor(r.status)}`}>{r.status}</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-lg font-black text-brand-600">R$ {r.totalPrice}</p>
                              </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                              {r.status === RentalStatus.PENDING && (
                                  <>
                                      <button onClick={() => handleAction(r.id, RentalStatus.CONFIRMED)} className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition shadow-lg">Confirmar</button>
                                      <button onClick={() => handleAction(r.id, RentalStatus.CANCELLED)} className="flex-1 bg-white text-red-500 border border-red-100 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition">Rejeitar</button>
                                  </>
                              )}
                              {r.status === RentalStatus.CONFIRMED && (
                                  <button onClick={() => handleAction(r.id, RentalStatus.ACTIVE)} className="w-full bg-blue-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Marcar como Entregue</button>
                              )}
                              {r.status === RentalStatus.ACTIVE && (
                                  <button onClick={() => handleAction(r.id, RentalStatus.COMPLETED)} className="w-full bg-gray-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Concluir Aluguel</button>
                              )}
                              {r.status === RentalStatus.COMPLETED && !alreadyReviewed && (
                                <button 
                                  onClick={() => setReviewingRental(r)} 
                                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition mb-2"
                                >
                                  <i className="fas fa-star mr-2"></i> Avaliar Locatário
                                </button>
                              )}
                              <button onClick={() => navigate(`/chat?with=${r.renterId}&item=${r.itemId}`)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Chat com Locatário</button>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seus Itens Cadastrados</h3>
                     <button onClick={() => navigate('/add-item')} className="bg-[#58B83F] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition">Novo Anúncio</button>
                  </div>
                  {myItems.length === 0 ? <p className="text-center py-20 text-gray-400 italic font-bold uppercase tracking-widest">Você ainda não anunciou nada.</p> :
                  myItems.map(item => {
                    const currentStatus = getItemCurrentStatus(item);
                    return (
                      <div key={item.id} className="p-4 border border-gray-100 rounded-3xl bg-gray-50/30 flex items-center justify-between hover:bg-white transition group relative overflow-hidden">
                        {/* Efeito de destaque ao selecionar para deletar */}
                        {itemToDelete?.id === item.id && (
                          <div className="absolute inset-0 bg-red-500/5 border-2 border-red-500 rounded-3xl pointer-events-none z-10 animate-pulse"></div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <img src={item.images[0]} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt="" />
                          <div>
                             <h4 className="font-bold text-gray-900 leading-none mb-1.5">{item.title}</h4>
                             <div className="flex items-center gap-2">
                               <span className={`w-2 h-2 rounded-full ${currentStatus === 'DISPONÍVEL' ? 'bg-green-500' : currentStatus === 'ALUGADO' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                               <p className={`text-[10px] font-bold uppercase ${currentStatus === 'DISPONÍVEL' ? 'text-green-600' : currentStatus === 'ALUGADO' ? 'text-blue-600' : 'text-red-500'}`}>
                                 {currentStatus}
                               </p>
                             </div>
                             <p className="text-brand-600 font-black text-xs mt-1">R$ {item.pricePerDay} / dia</p>
                          </div>
                        </div>
                        <div className="flex gap-2 relative z-20">
                           <button 
                              onClick={() => handleToggleAvailability(item)} 
                              className={`w-10 h-10 rounded-xl border transition flex items-center justify-center shadow-sm ${item.available ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-600 hover:text-white'}`}
                              title={item.available ? "Tornar Indisponível" : "Tornar Disponível"}
                            >
                              <i className={`fas ${item.available ? 'fa-toggle-on' : 'fa-toggle-off'} text-lg`}></i>
                           </button>
                           <button 
                              onClick={() => navigate(`/add-item?edit=${item.id}`)} 
                              className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-brand-600 hover:border-brand-200 transition flex items-center justify-center shadow-sm"
                              title="Editar"
                            >
                              <i className="fas fa-pencil-alt text-sm"></i>
                           </button>
                           <button 
                              onClick={() => setItemToDelete(item)} 
                              className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center shadow-sm"
                              title="Excluir"
                            >
                              <i className="fas fa-trash-alt text-sm"></i>
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-6 animate-fadeIn">
                   <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] mb-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-red-700 font-black uppercase tracking-tight text-lg mb-1">Central de Moderação</h3>
                        <p className="text-red-600/70 text-xs font-medium">Compare fotos de documentos com as selfies dos usuários.</p>
                      </div>
                      <div className="text-center bg-red-500 text-white px-4 py-2 rounded-2xl">
                          <p className="text-xl font-black">{pendingKycUsers.length}</p>
                          <p className="text-[8px] uppercase font-bold">Pendentes</p>
                      </div>
                   </div>
                   {pendingKycUsers.length === 0 ? <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-300 uppercase font-black text-xs tracking-widest">Nada pendente no momento</div> :
                      <div className="grid grid-cols-1 gap-4">
                         {pendingKycUsers.map(u => (
                            <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-200 flex items-center justify-between shadow-sm">
                               <div className="flex items-center gap-4">
                                  <img src={u.avatar || "https://i.pravatar.cc/150"} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                                  <h4 className="font-black text-gray-900 uppercase tracking-tighter">{u.name}</h4>
                               </div>
                               <button onClick={() => setSelectedKycReview(u)} className="bg-brand-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition">REVISAR AGORA</button>
                            </div>
                         ))}
                      </div>
                   }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveProfile} />}
    </div>
  );
};
