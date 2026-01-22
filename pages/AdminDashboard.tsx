
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Item, Rental, UserPlan, VerificationStatus, UserRole, RentalStatus } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';

export const AdminDashboard: React.FC = () => {
  const { user, allUsers, deleteUser, adminApproveKYC, adminRejectKYC, adminUpdateUser, createCollaborator, toggleUserStatus } = useAuth();
  const { items, rentals, logs, clearLogs, removeItem, updateItem, deleteUserData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'collaborators' | 'items' | 'rentals' | 'kyc' | 'logs'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [showColabModal, setShowColabModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [colabForm, setColabForm] = useState({
    name: '',
    email: '',
    password: '',
    jobTitle: '',
    role: 'USER' as UserRole,
    avatar: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MASTER_EMAIL = 'fabianodsfelix@gmail.com';
  const isAdminRole = user?.role === 'ADMIN';
  const hasCollaboratorTitle = !!user?.jobTitle && user.jobTitle.trim().length > 0;
  const isSystemColab = user?.id.startsWith('colab_');
  const hasFullAccess = user && user.isActive !== false && (isAdminRole || hasCollaboratorTitle || isSystemColab);

  useEffect(() => {
    if (!hasFullAccess) {
        navigate('/', { replace: true });
    }
  }, [hasFullAccess, navigate]);

  if (!hasFullAccess) return null;

  // --- CORE INTELLIGENCE ENGINE (BI) ---
  const bi = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const validRentals = (rentals || []).filter(r => r.status !== RentalStatus.CANCELLED);
    const gmvTotal = validRentals.reduce((sum: number, r: Rental) => sum + (Number(r.totalPrice) || 0), 0);
    const platformRevenue = gmvTotal * 0.10; 
    
    const gmvMonthly = (rentals || [])
      .filter(r => r.status !== RentalStatus.CANCELLED && new Date(r.createdAt).getTime() >= thirtyDaysAgo.getTime())
      .reduce((sum: number, r: Rental) => sum + (Number(r.totalPrice) || 0), 0);
    
    const ticketMedio = rentals.length > 0 ? (gmvTotal / rentals.length) : 0;
    const arpu = allUsers.length > 0 ? (platformRevenue / allUsers.length) : 0;

    const activeUsers = allUsers.filter(u => rentals.some(r => r.renterId === u.id || r.ownerId === u.id));
    const totalUsersCount = allUsers.length;
    const verifiedUsersCount = allUsers.filter(u => u.verificationStatus === VerificationStatus.VERIFIED).length;
    const verifiedPercent = totalUsersCount > 0 ? (verifiedUsersCount / totalUsersCount) * 100 : 0;
    
    const retainedUsers = allUsers.filter(u => {
        const joinDate = new Date(u.joinedDate);
        if (joinDate.getTime() >= thirtyDaysAgo.getTime()) return false;
        return rentals.some(r => (r.renterId === u.id || r.ownerId === u.id) && new Date(r.createdAt).getTime() >= thirtyDaysAgo.getTime());
    }).length;

    const baseForRetention = allUsers.filter(u => new Date(u.joinedDate).getTime() < thirtyDaysAgo.getTime()).length;
    const retentionRate = baseForRetention > 0 ? (retainedUsers / baseForRetention) * 100 : 0;

    const activeItems = items.filter(i => i.available).length;
    const neverRentedItems = items.filter(i => !rentals.some(r => r.itemId === i.id)).length;
    const neverRentedPercent = items.length > 0 ? (neverRentedItems / items.length) * 100 : 0;

    const rentalCounts = rentals.reduce((acc, r) => {
        acc[r.itemId] = (acc[r.itemId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const topRentedItems = Object.entries(rentalCounts)
        .sort((a, b) => (Number(b[1]) - Number(a[1])))
        .slice(0, 3)
        .map(([id, count]) => {
            const item = items.find(i => i.id === id);
            return { id, title: item?.title || 'Item Removido', image: item?.images?.[0] || '', count };
        });

    const completedRentalsCount = rentals.filter(r => r.status === RentalStatus.COMPLETED).length;
    const totalRentalsCount = rentals.length;
    const cancelledCount = rentals.filter(r => r.status === RentalStatus.CANCELLED).length;
    const cancellationRate = totalRentalsCount > 0 ? (Number(cancelledCount) / Number(totalRentalsCount)) * 100 : 0;
    
    const funnel = {
        visitors: allUsers.length * 12,
        searches: items.length * 8,
        requests: rentals.length,
        completed: completedRentalsCount
    };

    // New: Top Cities for BI
    const cityCounts = rentals.reduce((acc, r) => {
        const item = items.find(i => i.id === r.itemId);
        if (item) acc[item.city] = (acc[item.city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topCities = Object.entries(cityCounts).sort((a,b) => (Number(b[1]) - Number(a[1]))).slice(0, 3);

    return { 
        gmvTotal, platformRevenue, gmvMonthly, ticketMedio, arpu,
        activeUsersCount: activeUsers.length, verifiedPercent, retentionRate,
        activeItems, neverRentedPercent, completedRentalsCount, cancellationRate,
        topRentedItems, funnel, topCities
    };
  }, [allUsers, items, rentals]);

  const filteredUsers = allUsers.filter(u => 
    u.role !== 'ADMIN' && !u.jobTitle && !u.id.startsWith('colab_') &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredColabs = allUsers.filter(u => 
    (u.role === 'ADMIN' || u.jobTitle || u.id.startsWith('colab_')) &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(itemSearch.toLowerCase()));
  const pendingKYC = allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const handleSaveColab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const updateData: Partial<User> = {
          name: colabForm.name,
          email: colabForm.email,
          jobTitle: colabForm.jobTitle,
          role: colabForm.role,
          avatar: colabForm.avatar
        };
        if (colabForm.password) {
          updateData.password = colabForm.password;
        }
        await adminUpdateUser(editingUserId, updateData);
        alert("Colaborador atualizado com sucesso!");
      } else {
        await createCollaborator({
          name: colabForm.name,
          email: colabForm.email,
          password: colabForm.password,
          avatar: colabForm.avatar,
          jobTitle: colabForm.jobTitle,
          role: colabForm.role
        });
        alert("Colaborador criado com sucesso!");
      }
      setShowColabModal(false);
      setEditingUserId(null);
      setColabForm({ name: '', email: '', password: '', jobTitle: '', role: 'USER', avatar: '' });
    } catch (err) {
      console.error("Erro ao salvar colaborador:", err);
      alert("Erro ao salvar dados do colaborador.");
    }
  };

  const handleClearAuditLogs = () => {
    if (window.confirm("Deseja realmente limpar permanentemente todo o histórico de logs?")) {
        clearLogs();
    }
  };

  const handleDeleteUserAction = async (u: User) => {
    if (u.email === MASTER_EMAIL) { alert("A conta Master principal não pode ser excluída."); return; }
    if (window.confirm(`BLOQUEIO DE ACESSO: Deseja realmente excluir permanentemente o acesso e os dados do membro "${u.name}"?`)) {
        await deleteUser(u.id);
        deleteUserData(u.id); 
        alert("Acesso do membro excluído com sucesso.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      
      {showColabModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{editingUserId ? 'Editar Colaborador' : 'Inserir Colaborador'}</h3>
                 <button onClick={() => setShowColabModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
              </div>
              <form onSubmit={handleSaveColab} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                 <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-brand-100 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <img src={colabForm.avatar || "https://ui-avatars.com/api/?name=User&background=gray&color=fff"} className="w-full h-full object-cover" alt="" />
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><i className="fas fa-camera"></i></div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setColabForm(prev => ({ ...prev, avatar: reader.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }} />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                       <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" value={colabForm.name} onChange={e => setColabForm({...colabForm, name: e.target.value})} required />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                       <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" value={colabForm.email} onChange={e => setColabForm({...colabForm, email: e.target.value})} required />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{editingUserId ? 'Nova Senha' : 'Senha de Acesso'}</label>
                       <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" value={colabForm.password} onChange={e => setColabForm({...colabForm, password: e.target.value})} required={!editingUserId} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" value={colabForm.jobTitle} onChange={e => setColabForm({...colabForm, jobTitle: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Acesso</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none font-bold" value={colabForm.role} onChange={e => setColabForm({...colabForm, role: e.target.value as UserRole})}>
                             <option value="USER">Colaborador</option>
                             <option value="ADMIN">Admin Total</option>
                          </select>
                       </div>
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition active:scale-95 uppercase text-xs tracking-widest mt-4">CADASTRAR</button>
              </form>
           </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <BackButton label="Início" />
             <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${user?.email === MASTER_EMAIL ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-500 text-white'}`}>
                {user?.email === MASTER_EMAIL ? 'Master Admin' : 'Gestão Interna'}
             </span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Painel de Controle Master</h1>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[850px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col">
           <div className="p-8 space-y-2">
              <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-chart-line mr-3"></i> INTELLIGENCE BI
              </button>
              <button onClick={() => setActiveTab('users')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'users' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-users mr-3"></i> USUÁRIOS
              </button>
              <button onClick={() => setActiveTab('collaborators')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'collaborators' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-user-shield mr-3"></i> EQUIPE
              </button>
              <button onClick={() => setActiveTab('kyc')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'kyc' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-shield-alt mr-3"></i> MODERAÇÃO
                 {pendingKYC.length > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
              </button>
              <button onClick={() => setActiveTab('items')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'items' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-box-open mr-3"></i> INVENTÁRIO
              </button>
              <button onClick={() => setActiveTab('rentals')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'rentals' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-exchange-alt mr-3"></i> ALUGUÉIS
              </button>
              <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'logs' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-history mr-3"></i> LOGS AUDITORIA
              </button>
           </div>
           <div className="mt-auto p-8 border-t border-gray-100">
              <div className="flex items-center gap-3">
                 <img src={user?.avatar || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-xl object-cover" alt="" />
                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-900 truncate">{user?.name.split(' ')[0]}</p>
                    <p className="text-[8px] font-bold uppercase text-brand-600">{user?.jobTitle || 'Master'}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[850px] no-scrollbar">
           
           {/* --- TAB INTELLIGENCE BI (OVERVIEW) --- */}
           {activeTab === 'overview' && (
             <div className="space-y-10 animate-fadeIn pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">GMV Mensal (30d)</p>
                      <h3 className="text-3xl font-black text-gray-900">R$ {bi.gmvMonthly.toLocaleString('pt-BR')}</h3>
                      <p className="text-[10px] text-brand-600 font-bold mt-2">Receita Est: R$ {(Number(bi.gmvMonthly) * 0.1).toFixed(2)}</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Membros Ativos</p>
                      <h3 className="text-3xl font-black text-gray-900">{bi.activeUsersCount}</h3>
                      <p className="text-[10px] text-blue-500 font-bold mt-2">{bi.verifiedPercent.toFixed(1)}% Verificados</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Aluguéis Concluídos</p>
                      <h3 className="text-3xl font-black text-gray-900">{bi.completedRentalsCount}</h3>
                      <p className="text-[10px] text-purple-600 font-bold mt-2">Taxa Canc: {bi.cancellationRate.toFixed(1)}%</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retenção (30d)</p>
                      <h3 className="text-3xl font-black text-gray-900">{bi.retentionRate.toFixed(1)}%</h3>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                         <div className="bg-brand-500 h-full transition-all duration-1000" style={{ width: `${bi.retentionRate}%` }}></div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Funil de Conversão Estratégico</h4>
                      <div className="space-y-6">
                         {[
                             { label: 'Visitantes', value: bi.funnel.visitors, color: 'bg-gray-400', pct: 100 },
                             { label: 'Buscas Ativas', value: bi.funnel.searches, color: 'bg-blue-400', pct: Math.min(100, (bi.funnel.searches / (bi.funnel.visitors || 1)) * 100) },
                             { label: 'Pedidos Aluguel', value: bi.funnel.requests, color: 'bg-purple-400', pct: Math.min(100, (bi.funnel.requests / (bi.funnel.visitors || 1)) * 100) },
                             { label: 'Concluídos', value: bi.funnel.completed, color: 'bg-brand-500', pct: Math.min(100, (bi.funnel.completed / (bi.funnel.visitors || 1)) * 100) }
                         ].map((item, idx) => (
                             <div key={idx} className="relative group">
                                <div className="flex justify-between items-center mb-1.5 px-2">
                                   <span className="text-[10px] font-black uppercase text-gray-500">{item.label}</span>
                                   <span className="text-[11px] font-bold text-gray-900">{item.value.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-white h-8 rounded-2xl overflow-hidden border border-gray-100 flex p-1 shadow-inner">
                                   <div className={`${item.color} h-full rounded-xl transition-all duration-1000 ease-out`} style={{ width: `${item.pct}%` }}></div>
                                </div>
                             </div>
                         ))}
                      </div>
                      <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between items-center px-2">
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Conversão Geral</p>
                            <p className="text-2xl font-black text-brand-600">{((bi.funnel.completed / (bi.funnel.visitors || 1)) * 100).toFixed(2)}%</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Ticket Médio</p>
                            <p className="text-2xl font-black text-gray-900">R$ {bi.ticketMedio.toFixed(0)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Top Itens Alugados</h4>
                         <div className="space-y-5">
                            {bi.topRentedItems.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Sem dados de locação</p>
                            ) : (
                                bi.topRentedItems.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-50 flex-shrink-0 shadow-sm">
                                                <img src={item.image} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                                                <p className="text-[9px] font-black text-brand-500 uppercase">{item.count} aluguéis</p>
                                            </div>
                                        </div>
                                        <i className="fas fa-chevron-right text-[8px] text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all"></i>
                                    </div>
                                ))
                            )}
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Cidades em Destaque</h4>
                         <div className="space-y-4">
                            {bi.topCities.map(([city, count], idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 border border-gray-100">{idx+1}</span>
                                        <span className="text-xs font-bold text-gray-700">{city}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">{count} locações</span>
                                </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* --- TAB USERS & EQUIPE --- */}
           {(activeTab === 'users' || activeTab === 'collaborators') && (
              <div className="space-y-6 animate-fadeIn">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100">
                       <i className="fas fa-search text-gray-400 ml-4"></i>
                       <input 
                         type="text" 
                         className="bg-transparent border-none outline-none w-full font-bold text-gray-700" 
                         placeholder={`Buscar em ${activeTab === 'users' ? 'Usuários' : 'Equipe'}...`} 
                         value={userSearch} 
                         onChange={e => setUserSearch(e.target.value)} 
                       />
                    </div>
                    {activeTab === 'collaborators' && user?.email === MASTER_EMAIL && (
                      <button onClick={() => { setEditingUserId(null); setColabForm({ name: '', email: '', password: '', jobTitle: '', role: 'USER', avatar: '' }); setShowColabModal(true); }} className="bg-[#58B83F] hover:bg-brand-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition transform active:scale-95 flex items-center gap-2">
                         <i className="fas fa-plus"></i> Inserir Colaborador
                      </button>
                    )}
                 </div>

                 <div className="overflow-x-auto bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                             <th className="px-6 py-5">Membro / Cargo</th>
                             <th className="px-6 py-5">Status</th>
                             <th className="px-6 py-5">Nível / Plano</th>
                             <th className="px-6 py-5 text-center">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {(activeTab === 'users' ? filteredUsers : filteredColabs).length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">Nenhum membro encontrado.</td></tr>
                          ) : (activeTab === 'users' ? filteredUsers : filteredColabs).map(u => (
                             <tr key={u.id} className={`hover:bg-gray-50/50 transition ${u.isActive === false ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-6">
                                   <div className="flex items-center gap-3">
                                      <img src={u.avatar || "https://ui-avatars.com/api/?name="+u.name+"&background=gray&color=fff"} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                                      <div><p className="font-bold text-gray-900 mb-1 leading-none">{u.name}</p><p className="text-[9px] text-gray-400 uppercase font-black">{u.email}</p></div>
                                   </div>
                                </td>
                                <td className="px-6 py-6">
                                   <div className="flex flex-col gap-1.5">
                                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg w-fit ${u.verified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{u.verified ? 'Verificado' : 'Pendente'}</span>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${u.isActive === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{u.isActive === false ? 'Inativo' : 'Ativo'}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-6">
                                   <div className="flex flex-col gap-1">
                                      <span className={`text-[8px] font-black uppercase w-fit px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
                                        {u.jobTitle || (u.role === 'ADMIN' ? 'ADMIN' : 'USER')}
                                      </span>
                                      <span className="text-[9px] text-gray-400 font-bold uppercase">{u.plan}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-6">
                                   <div className="flex justify-center gap-2">
                                      <button onClick={() => navigate(`/profile/${u.id}`)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition flex items-center justify-center border border-blue-100/30"><i className="fas fa-eye text-xs"></i></button>
                                      {activeTab === 'collaborators' && (u.email !== MASTER_EMAIL || user?.email === MASTER_EMAIL) && (
                                         <button onClick={() => { 
                                           setEditingUserId(u.id); 
                                           setColabForm({ name: u.name, email: u.email, password: '', jobTitle: u.jobTitle || '', role: u.role, avatar: u.avatar || '' }); 
                                           setShowColabModal(true); 
                                         }} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-brand-500 hover:text-white transition flex items-center justify-center border border-gray-100"><i className="fas fa-pencil-alt text-xs"></i></button>
                                      )}
                                      <button disabled={u.email === MASTER_EMAIL} onClick={() => toggleUserStatus(u.id)} className={`w-9 h-9 rounded-xl transition flex items-center justify-center border ${u.email === MASTER_EMAIL ? 'opacity-20' : ''} ${u.isActive === false ? 'bg-green-50 text-green-500 border-green-100/30 hover:bg-green-500 hover:text-white' : 'bg-orange-50 text-orange-500 border-orange-100/30 hover:bg-orange-500 hover:text-white'}`}><i className={`fas ${u.isActive === false ? 'fa-power-off' : 'fa-ban'} text-xs`}></i></button>
                                      <button disabled={u.email === MASTER_EMAIL} onClick={() => handleDeleteUserAction(u)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center border border-red-100/30 disabled:opacity-20"><i className="fas fa-trash-alt text-xs"></i></button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* --- TAB MODERAÇÃO (KYC) --- */}
           {activeTab === 'kyc' && (
              <div className="space-y-8 animate-fadeIn">
                 <div className="mb-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Fila de Verificação de Identidade</h3>
                    <p className="text-sm text-gray-400 font-medium">Analise documentos e selfies enviados para validação de segurança.</p>
                 </div>

                 {pendingKYC.length === 0 ? (
                    <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <i className="fas fa-check-double text-3xl text-brand-500"></i>
                        </div>
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma pendência no momento.</p>
                    </div>
                 ) : (
                    pendingKYC.map(u => (
                       <div key={u.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col gap-10 animate-fadeIn">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-gray-50">
                             <div className="flex items-center gap-6">
                                <img src={u.avatar || "https://ui-avatars.com/api/?name="+u.name} className="w-20 h-20 rounded-[2rem] object-cover border-2 border-brand-50 shadow-md" alt="" />
                                <div>
                                   <p className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{u.name}</p>
                                   <div className="flex flex-wrap gap-2">
                                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-gray-100 text-gray-500">{u.email}</span>
                                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-brand-50 text-brand-700">{u.userType}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex gap-4 w-full md:w-auto">
                                <button 
                                  onClick={() => adminRejectKYC(u.id)} 
                                  className="flex-1 md:flex-none bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition shadow-sm"
                                >
                                  Rejeitar
                                </button>
                                <button 
                                  onClick={() => adminApproveKYC(u.id)} 
                                  className="flex-1 md:flex-none bg-brand-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition shadow-xl shadow-brand-100"
                                >
                                  Aprovar
                                </button>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Documento Enviado</p>
                                <div className="aspect-video bg-gray-100 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-inner">
                                   <img src={u.documentUrl} className="w-full h-full object-contain" alt="Documento" />
                                </div>
                             </div>
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Selfie de Validação</p>
                                <div className="aspect-video bg-gray-100 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-inner">
                                   <img src={u.selfieUrl} className="w-full h-full object-contain" alt="Selfie" />
                                </div>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           )}

           {/* --- TAB INVENTÁRIO (ITEMS) --- */}
           {activeTab === 'items' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100">
                   <i className="fas fa-search text-gray-400 ml-4"></i>
                   <input type="text" className="bg-transparent border-none outline-none w-full font-bold" placeholder="Filtrar inventário global..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {filteredItems.length === 0 ? (
                     <div className="col-span-full py-20 text-center text-gray-400 italic font-bold uppercase tracking-widest">Nenhum item em estoque.</div>
                   ) : filteredItems.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition">
                         <div className="flex items-center gap-4">
                            <img src={item.images[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                            <div>
                               <p className="font-bold text-gray-900 mb-1 leading-tight">{item.title}</p>
                               <p className="text-[10px] text-brand-600 font-black">R$ {item.pricePerDay} / dia</p>
                               <p className="text-[9px] text-gray-400 uppercase font-bold">{item.city}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => navigate(`/item/${item.id}`)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 transition flex items-center justify-center"><i className="fas fa-external-link-alt text-xs"></i></button>
                            <button onClick={() => { if(window.confirm("Remover anúncio permanentemente?")) removeItem(item.id) }} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* --- TAB ALUGUÉIS (RENTALS) --- */}
           {activeTab === 'rentals' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="mb-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Fluxo Global de Aluguéis</h3>
                    <p className="text-sm text-gray-400 font-medium">Monitoramento de transações em tempo real na rede Bora Alugar.</p>
                </div>
                <div className="grid gap-4">
                    {rentals.length === 0 ? (
                        <div className="text-center py-20 text-gray-300 font-black uppercase tracking-widest">Aguardando as primeiras locações</div>
                    ) : (
                        rentals.map(r => (
                        <div key={r.id} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-4 flex-1">
                                <img src={r.itemImage} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                                <div>
                                    <p className="font-bold text-gray-900 leading-none mb-2">{r.itemTitle}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${
                                            r.status === RentalStatus.CANCELLED ? 'bg-red-50 text-red-600' :
                                            r.status === RentalStatus.COMPLETED ? 'bg-gray-100 text-gray-600' : 'bg-brand-50 text-brand-700'
                                        }`}>{r.status}</span>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">R$ {r.totalPrice}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end">
                                <span className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-1">Solicitado em</span>
                                <span className="text-xs font-bold text-gray-700 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        ))
                    )}
                </div>
             </div>
           )}

           {/* --- TAB LOGS AUDITORIA --- */}
           {activeTab === 'logs' && (
              <div className="space-y-6 animate-fadeIn">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Logs de Auditoria Global</h3>
                    <button onClick={handleClearAuditLogs} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition shadow-sm">Limpar Histórico</button>
                 </div>
                 
                 <div className="overflow-x-auto bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                <th className="px-6 py-4">Data / Hora</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Detalhes / Usuário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length === 0 ? (
                                <tr><td colSpan={3} className="p-20 text-center text-gray-300 uppercase font-black tracking-widest text-xs">Sem logs registrados ainda.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="text-xs hover:bg-gray-50 transition">
                                        <td className="px-6 py-5 whitespace-nowrap font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded font-black text-[9px] uppercase ${
                                                log.action.includes('FALHA') || log.action.includes('EXCLUSÃO') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>{log.action}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-gray-800 font-medium mb-0.5">{log.details}</p>
                                            {log.userEmail && <p className="text-[9px] text-gray-400 font-bold">Resp: {log.userEmail}</p>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
