
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Item, Rental, UserPlan, VerificationStatus, UserRole } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';

export const AdminDashboard: React.FC = () => {
  const { user, getAllUsers, deleteUser, adminApproveKYC, adminRejectKYC, adminUpdateUser, createCollaborator, toggleUserStatus } = useAuth();
  const { items, rentals, removeItem, updateItem, deleteUserData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'collaborators' | 'items' | 'rentals' | 'kyc'>('overview');
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

  // Lógica de Segurança Ultra-Rigorosa
  const MASTER_EMAIL = 'fabianodsfelix@gmail.com';
  const isMaster = user?.email === MASTER_EMAIL;
  const isAdminRole = user?.role === 'ADMIN';
  const hasCollaboratorTitle = !!user?.jobTitle && user.jobTitle.trim().length > 0;
  const isSystemColab = user?.id.startsWith('colab_');
  
  // Apenas quem é ADMIN ou quem tem cargo/id de colaborador entra
  const hasFullAccess = user && user.isActive !== false && (isAdminRole || hasCollaboratorTitle || isSystemColab);

  useEffect(() => {
    if (!hasFullAccess) {
        navigate('/', { replace: true });
    }
  }, [hasFullAccess, navigate]);

  // Se o componente tentar renderizar sem acesso, retorna nada (bloqueio visual)
  if (!hasFullAccess) return null;

  const allUsers = getAllUsers();
  
  // Filtra Usuários (Não Admins e Não Colaboradores)
  const filteredUsers = allUsers.filter(u => 
    u.role !== 'ADMIN' && 
    !u.jobTitle && 
    !u.id.startsWith('colab_') &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
     u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // Filtra Equipe (Admins e Colaboradores)
  const filteredColabs = allUsers.filter(u => 
    (u.role === 'ADMIN' || u.jobTitle || u.id.startsWith('colab_')) &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
     u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const pendingKYC = allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const totalRevenue = rentals.reduce((acc, r) => acc + r.totalPrice, 0);
  const activeRentals = rentals.filter(r => r.status !== 'Concluído' && r.status !== 'Cancelado').length;

  const handleDeleteUserAction = async (u: User) => {
    if (u.email === MASTER_EMAIL) {
        alert("A conta Master principal não pode ser excluída.");
        return;
    }

    const confirmMsg = `BLOQUEIO DE ACESSO: Deseja realmente excluir permanentemente o acesso e os dados do membro "${u.name}"?`;

    if (window.confirm(confirmMsg)) {
        await deleteUser(u.id);
        deleteUserData(u.id); 
        alert("Acesso do membro excluído do sistema com sucesso.");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setColabForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenColabModal = (targetUser?: User) => {
    if (targetUser) {
      // Bloqueio de Segurança: Não permitir abrir edição do Master se o logado não for o Master
      if (targetUser.email === MASTER_EMAIL && !isMaster) {
        alert("Atenção: Apenas o Administrador Master pode alterar seus próprios dados de sistema.");
        return;
      }

      setEditingUserId(targetUser.id);
      setColabForm({
        name: targetUser.name,
        email: targetUser.email,
        password: targetUser.password || '',
        jobTitle: targetUser.jobTitle || '',
        role: targetUser.role,
        avatar: targetUser.avatar || ''
      });
    } else {
      setEditingUserId(null);
      setColabForm({ name: '', email: '', password: '', jobTitle: '', role: 'USER', avatar: '' });
    }
    setShowColabModal(true);
  };

  const handleSaveColab = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação de Identidade do Alvo
    const targetUser = allUsers.find(u => u.id === editingUserId);
    if (targetUser?.email === MASTER_EMAIL && !isMaster) {
        alert("Operação negada: Você não tem permissão para alterar os dados do Administrador Master.");
        return;
    }

    // Apenas o Master pode criar/editar colaboradores em geral, 
    // ou um Admin editar a si mesmo (exceto se o si mesmo for o Master, já tratado acima)
    if (!isMaster && editingUserId !== user?.id) {
        alert("Apenas o Administrador Master possui permissão global para gerenciar a equipe.");
        return;
    }

    if (!colabForm.name || !colabForm.email || (!editingUserId && !colabForm.password)) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }
    
    const finalData = {
        ...colabForm,
        jobTitle: colabForm.jobTitle.trim() || 'Colaborador'
    };

    if (editingUserId) {
        // Modo Edição
        await adminUpdateUser(editingUserId, finalData);
        alert("Colaborador atualizado com sucesso!");
    } else {
        // Modo Criação
        await createCollaborator(finalData);
        alert("Colaborador inserido com sucesso!");
    }

    setShowColabModal(false);
    setEditingUserId(null);
    setColabForm({ name: '', email: '', password: '', jobTitle: '', role: 'USER', avatar: '' });
    setActiveTab('collaborators');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      
      {showColabModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                   {editingUserId ? 'Editar Colaborador' : 'Inserir Colaborador'}
                 </h3>
                 <button onClick={() => setShowColabModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
              </div>
              <form onSubmit={handleSaveColab} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                 <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-brand-100 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <img src={colabForm.avatar || "https://ui-avatars.com/api/?name=User&background=gray&color=fff"} className="w-full h-full object-cover" alt="" />
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><i className="fas fa-camera"></i></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Foto do Perfil</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                       <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" placeholder="Nome do colaborador" value={colabForm.name} onChange={e => setColabForm({...colabForm, name: e.target.value})} required />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                       <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" placeholder="email@empresa.com" value={colabForm.email} onChange={e => setColabForm({...colabForm, email: e.target.value})} required />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                         {editingUserId ? 'Nova Senha (deixe vazio para manter)' : 'Senha de Acesso'}
                       </label>
                       <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" placeholder="••••••••" value={colabForm.password} onChange={e => setColabForm({...colabForm, password: e.target.value})} required={!editingUserId} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" placeholder="Ex: Moderador" value={colabForm.jobTitle} onChange={e => setColabForm({...colabForm, jobTitle: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nível de Acesso</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none font-bold" value={colabForm.role} onChange={e => setColabForm({...colabForm, role: e.target.value as UserRole})}>
                             <option value="USER">Padrão (Colaborador)</option>
                             <option value="ADMIN">Administrador (Total)</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition active:scale-95 uppercase text-xs tracking-widest mt-4">
                   {editingUserId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR COLABORADOR'}
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <BackButton label="Início" />
             <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${isMaster ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-500 text-white'}`}>
                {isMaster ? 'Master Admin' : 'Gestão Interna'}
             </span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
             {isMaster ? 'Painel de Controle Master' : 'Gestão Administrativa'}
           </h1>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col">
           <div className="p-8 space-y-2">
              <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-chart-pie mr-3"></i> Resumo
              </button>
              <button onClick={() => setActiveTab('users')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'users' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-users mr-3"></i> Usuários
              </button>
              <button onClick={() => setActiveTab('collaborators')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'collaborators' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-user-shield mr-3"></i> Colaboradores
              </button>
              <button onClick={() => setActiveTab('kyc')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition relative ${activeTab === 'kyc' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-shield-alt mr-3"></i> Moderação
                 {pendingKYC.length > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              <button onClick={() => setActiveTab('items')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'items' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-box-open mr-3"></i> Inventário
              </button>
              <button onClick={() => setActiveTab('rentals')} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'rentals' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <i className="fas fa-exchange-alt mr-3"></i> Aluguéis
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

        <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[750px] no-scrollbar">
           
           {(activeTab === 'users' || activeTab === 'collaborators') && (
              <div className="space-y-6 animate-fadeIn">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100">
                       <i className="fas fa-search text-gray-400 ml-4"></i>
                       <input 
                         type="text" 
                         className="bg-transparent border-none outline-none w-full font-bold text-gray-700" 
                         placeholder={`Buscar em ${activeTab === 'users' ? 'Usuários' : 'Colaboradores'}...`} 
                         value={userSearch}
                         onChange={e => setUserSearch(e.target.value)}
                       />
                    </div>
                    {activeTab === 'collaborators' && isMaster && (
                      <button 
                        onClick={() => handleOpenColabModal()} 
                        className="bg-[#58B83F] hover:bg-brand-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-100 transition transform active:scale-95 flex items-center gap-2"
                        style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}
                      >
                         <i className="fas fa-plus"></i> Inserir Colaborador
                      </button>
                    )}
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                             <th className="px-4 py-4">Membro / Cargo</th>
                             <th className="px-4 py-4">Status</th>
                             <th className="px-4 py-4">Nível / Plano</th>
                             <th className="px-4 py-4 text-center">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {(activeTab === 'users' ? filteredUsers : filteredColabs).map(u => {
                             const isTargetMaster = u.email === MASTER_EMAIL;
                             // Regra: Só pode editar o Master se o logado for o Master.
                             const canShowEdit = !isTargetMaster || isMaster;

                             return (
                                <tr key={u.id} className={`hover:bg-gray-50/50 transition ${u.isActive === false ? 'opacity-50' : ''}`}>
                                   <td className="px-4 py-6">
                                      <div className="flex items-center gap-3">
                                         <img src={u.avatar || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                                         <div>
                                            <p className="font-bold text-gray-900 leading-none mb-1.5">{u.name}</p>
                                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-tight">{u.email}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-4 py-6">
                                      <div className="flex flex-col gap-1.5">
                                         <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg w-fit ${u.verified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {u.verified ? 'Verificado' : 'Pendente'}
                                         </span>
                                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${u.isActive === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {u.isActive === false ? 'Inativo' : 'Ativo'}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-4 py-6">
                                      <div className="flex flex-col gap-1">
                                         <span className={`text-[8px] font-black uppercase w-fit px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
                                            {u.jobTitle || (u.role === 'ADMIN' ? 'ADMIN' : 'USER')}
                                         </span>
                                         <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{u.plan}</span>
                                      </div>
                                   </td>
                                   <td className="px-4 py-6">
                                      <div className="flex justify-center gap-2">
                                         <button onClick={() => navigate(`/profile/${u.id}`)} title="Ver Perfil" className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition flex items-center justify-center border border-blue-100/30">
                                            <i className="fas fa-eye text-xs"></i>
                                         </button>
                                         
                                         {/* Botão de Edição (Pencil) com trava de visibilidade */}
                                         {activeTab === 'collaborators' && canShowEdit && (
                                           <button 
                                             onClick={() => handleOpenColabModal(u)} 
                                             title="Editar Colaborador"
                                             className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-brand-500 hover:text-white transition flex items-center justify-center border border-gray-100"
                                           >
                                              <i className="fas fa-pencil-alt text-xs"></i>
                                           </button>
                                         )}

                                         {/* Botão de Bloqueio com Trava para o Master */}
                                         <button 
                                            disabled={isTargetMaster}
                                            onClick={() => toggleUserStatus(u.id)} 
                                            title={isTargetMaster ? "Conta Mestre Protegida" : (u.isActive === false ? "Ativar Acesso" : "Desativar Acesso")}
                                            className={`w-9 h-9 rounded-xl transition flex items-center justify-center border ${isTargetMaster ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${u.isActive === false ? 'bg-green-50 text-green-500 border-green-100/30 hover:bg-green-500 hover:text-white' : 'bg-orange-50 text-orange-500 border-orange-100/30 hover:bg-orange-500 hover:text-white'}`}
                                         >
                                            <i className={`fas ${u.isActive === false ? 'fa-power-off' : 'fa-ban'} text-xs`}></i>
                                         </button>

                                         <button 
                                            disabled={u.email === MASTER_EMAIL}
                                            onClick={() => handleDeleteUserAction(u)} 
                                            title="Excluir Permanentemente"
                                            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center border border-red-100/30 disabled:opacity-20"
                                         >
                                            <i className="fas fa-trash-alt text-xs"></i>
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {activeTab === 'overview' && (
             <div className="space-y-10 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="bg-brand-50 p-8 rounded-[2.5rem] border border-brand-100">
                      <p className="text-4xl font-black text-brand-600">{allUsers.length}</p>
                      <p className="text-[10px] font-black uppercase text-brand-900 tracking-widest mt-2">Membros Totais</p>
                   </div>
                   <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                      <p className="text-4xl font-black text-blue-600">{items.length}</p>
                      <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest mt-2">Itens em Giro</p>
                   </div>
                   <div className="bg-purple-50 p-8 rounded-[2.5rem] border border-purple-100">
                      <p className="text-4xl font-black text-purple-600">{activeRentals}</p>
                      <p className="text-[10px] font-black uppercase text-purple-900 tracking-widest mt-2">Aluguéis Ativos</p>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'items' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[2rem] border border-gray-100">
                   <i className="fas fa-search text-gray-400 ml-4"></i>
                   <input 
                     type="text" 
                     className="bg-transparent border-none outline-none w-full font-bold" 
                     placeholder="Filtrar inventário..." 
                     value={itemSearch}
                     onChange={e => setItemSearch(e.target.value)}
                   />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {filteredItems.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-4">
                            <img src={item.images[0]} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                            <div>
                               <p className="font-bold text-gray-900 leading-tight mb-1">{item.title}</p>
                               <p className="text-[10px] text-brand-600 font-black uppercase">R$ {item.pricePerDay} / dia</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => navigate(`/item/${item.id}`)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600"><i className="fas fa-external-link-alt"></i></button>
                            <button onClick={() => removeItem(item.id)} className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition"><i className="fas fa-times"></i></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'kyc' && (
              <div className="space-y-8 animate-fadeIn">
                 {pendingKYC.length === 0 ? <div className="text-center py-20 text-gray-300 font-black uppercase tracking-widest">Nenhuma verificação pendente</div> :
                    pendingKYC.map(u => (
                       <div key={u.id} className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <img src={u.avatar || "https://i.pravatar.cc/100"} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                                <div>
                                   <p className="text-lg font-black text-gray-900">{u.name}</p>
                                   <p className="text-sm text-gray-400 font-medium">{u.email}</p>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button onClick={() => adminRejectKYC(u.id)} className="bg-white border border-red-200 text-red-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase">Rejeitar</button>
                                <button onClick={() => adminApproveKYC(u.id)} className="bg-brand-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">Aprovar Agora</button>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <img src={u.documentUrl} className="aspect-video bg-white rounded-2xl object-contain border border-gray-100" alt="Documento" />
                             <img src={u.selfieUrl} className="aspect-video bg-white rounded-2xl object-contain border border-gray-100" alt="Selfie" />
                          </div>
                       </div>
                    ))
                 }
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
