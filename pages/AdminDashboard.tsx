
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Item, Rental, UserPlan, VerificationStatus, UserRole, RentalStatus } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';

export const AdminDashboard: React.FC = () => {
  const { user, allUsers, deleteUser, adminApproveKYC, adminRejectKYC, adminUpdateUser, createCollaborator, toggleUserStatus } = useAuth();
  const { items, rentals, removeItem, updateItem, deleteUserData } = useData();
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
  const hasFullAccess = user && user.isActive !== false && (isAdminRole || !!user.jobTitle);

  useEffect(() => {
    if (!hasFullAccess) {
        navigate('/', { replace: true });
    }
  }, [hasFullAccess, navigate]);

  if (!hasFullAccess) return null;

  const bi = useMemo(() => {
    const validRentals = rentals.filter(r => r.status !== RentalStatus.CANCELLED);
    const gmvTotal = validRentals.reduce((sum, r) => sum + r.totalPrice, 0);
    const platformRevenue = gmvTotal * 0.10; 
    const ticketMedio = rentals.length > 0 ? (gmvTotal / rentals.length) : 0;
    const activeItemsCount = items.filter(i => i.available).length;
    const pendingKYCCount = allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING).length;

    return { gmvTotal, platformRevenue, ticketMedio, activeItemsCount, pendingKYCCount };
  }, [allUsers, items, rentals]);

  const filteredUsers = allUsers.filter(u => 
    u.role !== 'ADMIN' && !u.jobTitle &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredColabs = allUsers.filter(u => 
    (u.role === 'ADMIN' || u.jobTitle) &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(itemSearch.toLowerCase()));
  const pendingKYC = allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const handleSaveColab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await adminUpdateUser(editingUserId, colabForm);
      } else {
        await createCollaborator(colabForm);
      }
      setShowColabModal(false);
      setEditingUserId(null);
    } catch (err) {
      alert("Erro ao salvar colaborador.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <BackButton label="Início" />
             <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-brand-500 text-white shadow-lg">Painel Master</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Administração Bora Alugar</h1>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-2">
           {[
             { id: 'overview', icon: 'fa-chart-line', label: 'Dashboard' },
             { id: 'users', icon: 'fa-users', label: 'Membros' },
             { id: 'collaborators', icon: 'fa-user-shield', label: 'Equipe' },
             { id: 'kyc', icon: 'fa-id-card', label: 'Moderação', count: bi.pendingKYCCount },
             { id: 'items', icon: 'fa-box', label: 'Inventário' },
             { id: 'rentals', icon: 'fa-exchange-alt', label: 'Aluguéis' }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-between ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white'}`}
             >
                <span className="flex items-center gap-3"><i className={`fas ${tab.icon}`}></i> {tab.label}</span>
                {tab.count && tab.count > 0 && <span className="bg-red-500 text-white text-[8px] h-4 w-4 flex items-center justify-center rounded-full">{tab.count}</span>}
             </button>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
           {activeTab === 'overview' && (
             <div className="space-y-10 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-brand-50 p-8 rounded-[2.5rem] border border-brand-100 shadow-sm">
                      <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-2">Volume Total (GMV)</p>
                      <h3 className="text-3xl font-black text-brand-900">R$ {bi.gmvTotal.toLocaleString('pt-BR')}</h3>
                   </div>
                   <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Comissões Est. (10%)</p>
                      <h3 className="text-3xl font-black text-blue-900">R$ {bi.platformRevenue.toLocaleString('pt-BR')}</h3>
                   </div>
                   <div className="bg-purple-50 p-8 rounded-[2.5rem] border border-purple-100 shadow-sm">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Itens em Oferta</p>
                      <h3 className="text-3xl font-black text-purple-900">{bi.activeItemsCount}</h3>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                   <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Atividade Recente</h4>
                   <div className="space-y-4">
                      {rentals.slice(0, 5).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                           <div className="flex items-center gap-4">
                              <img src={r.itemImage} className="w-10 h-10 rounded-xl object-cover" />
                              <div>
                                 <p className="text-xs font-bold text-gray-900">{r.itemTitle}</p>
                                 <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(r.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <span className="text-xs font-black text-brand-600">R$ {r.totalPrice}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {(activeTab === 'users' || activeTab === 'collaborators') && (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100">
                   <i className="fas fa-search text-gray-400 ml-4"></i>
                   <input 
                     type="text" 
                     className="bg-transparent border-none outline-none w-full font-bold text-gray-700" 
                     placeholder="Buscar membros..." 
                     value={userSearch} 
                     onChange={e => setUserSearch(e.target.value)} 
                   />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                            <th className="px-6 py-4">Membro</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Plano</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {(activeTab === 'users' ? filteredUsers : filteredColabs).map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition">
                               <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                     <img src={u.avatar || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-xl object-cover" />
                                     <div><p className="font-bold text-gray-900">{u.name}</p><p className="text-[10px] text-gray-400">{u.email}</p></div>
                                  </div>
                               </td>
                               <td className="px-6 py-5">
                                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${u.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{u.verified ? 'Verificado' : 'Pendente'}</span>
                               </td>
                               <td className="px-6 py-5 text-xs font-bold text-gray-600">{u.plan}</td>
                               <td className="px-6 py-5">
                                  <div className="flex justify-center gap-2">
                                     <button onClick={() => navigate(`/profile/${u.id}`)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-brand-500 hover:text-white transition"><i className="fas fa-eye text-xs"></i></button>
                                     <button onClick={() => toggleUserStatus(u.id)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-orange-500 hover:text-white transition"><i className="fas fa-ban text-xs"></i></button>
                                     <button onClick={() => deleteUser(u.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><i className="fas fa-trash text-xs"></i></button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === 'kyc' && (
             <div className="space-y-8 animate-fadeIn">
                {pendingKYC.length === 0 ? (
                  <div className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest italic">Nenhuma verificação pendente</div>
                ) : pendingKYC.map(u => (
                  <div key={u.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                           <img src={u.avatar || "https://i.pravatar.cc/100"} className="w-16 h-16 rounded-2xl object-cover" />
                           <div><h3 className="text-xl font-black text-gray-900">{u.name}</h3><p className="text-xs text-gray-400">{u.email}</p></div>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => adminRejectKYC(u.id)} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase">Rejeitar</button>
                           <button onClick={() => adminApproveKYC(u.id)} className="bg-brand-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Aprovar Membro</button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><p className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Documento</p><img src={u.documentUrl} className="w-full rounded-2xl border border-gray-100 shadow-inner h-64 object-contain bg-gray-50" /></div>
                        <div><p className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Selfie</p><img src={u.selfieUrl} className="w-full rounded-2xl border border-gray-100 shadow-inner h-64 object-contain bg-gray-50" /></div>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'items' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
                {items.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition">
                     <div className="flex items-center gap-4">
                        <img src={item.images[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                        <div>
                           <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{item.title}</p>
                           <p className="text-[9px] text-brand-600 font-black uppercase">R$ {item.pricePerDay}/dia</p>
                        </div>
                     </div>
                     <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-trash-alt"></i></button>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
