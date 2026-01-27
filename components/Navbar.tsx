
import React, { useState, useEffect, useRef } from 'react';
// Changed import from react-router-dom to react-router to support consolidated exports in newer versions
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Logo } from './Logo';
import { RentalStatus, NotificationType } from '../types';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, getPendingUsers } = useAuth();
  const { messages, rentals, notifications, markNotificationAsRead, clearNotifications } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsMenuOpen(false);

  const unreadCount = user ? messages.filter(m => m.receiverId === user.id && !m.read).length : 0;
  const pendingRequestsCount = user ? rentals.filter(r => r.ownerId === user.id && r.status === RentalStatus.PENDING).length : 0;
  const myNotifications = user ? notifications.filter(n => n.userId === user.id) : [];
  const unreadNotifCount = myNotifications.filter(n => !n.read).length;
  
  // Moderação pendente para Admin
  const pendingKycCount = user?.role === 'ADMIN' ? getPendingUsers().length : 0;

  // Definição de Autoridade Administrativa (Admin ou Colaborador Ativo)
  const hasAdminAccess = user && user.isActive !== false && (user.role === 'ADMIN' || !!user.jobTitle || user.id.startsWith('colab_'));

  const getNotifIcon = (type: NotificationType) => {
    switch(type) {
      case NotificationType.RENTAL_REQUEST: return <i className="fas fa-hand-holding-heart text-brand-600"></i>;
      case NotificationType.RENTAL_UPDATE: return <i className="fas fa-sync text-blue-500"></i>;
      case NotificationType.MESSAGE: return <i className="fas fa-envelope text-brand-500"></i>;
      case NotificationType.SYSTEM: return <i className="fas fa-info-circle text-gray-500"></i>;
    }
  };

  const handleNotifClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    setIsNotifOpen(false);
    navigate(notif.link);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center group">
              <Logo className="h-14" />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/search" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md font-medium transition">
              Explorar
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/add-item" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md font-medium transition">
                  Anunciar Item
                </Link>

                {/* Sino de Notificações */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="text-gray-600 hover:text-brand-600 p-2 rounded-xl transition relative bg-gray-50 hover:bg-gray-100"
                  >
                    <i className="fas fa-bell text-xl"></i>
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-black h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Notificações</h4>
                        <button onClick={() => clearNotifications(user!.id)} className="text-[9px] font-black text-brand-600 uppercase hover:underline">Limpar tudo</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto no-scrollbar">
                        {myNotifications.length === 0 ? (
                          <div className="p-10 text-center">
                            <i className="fas fa-bell-slash text-gray-200 text-3xl mb-3"></i>
                            <p className="text-xs text-gray-400 font-bold uppercase">Nenhuma notificação</p>
                          </div>
                        ) : (
                          myNotifications.map(notif => (
                            <button 
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full text-left p-4 hover:bg-brand-50 transition border-b border-gray-50 flex gap-3 ${!notif.read ? 'bg-brand-50/30' : ''}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs ${!notif.read ? 'font-black' : 'font-bold'} text-gray-900 leading-tight mb-0.5`}>{notif.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight mb-1">{notif.message}</p>
                                <p className="text-[8px] text-gray-400 font-black uppercase">{new Date(notif.createdAt).toLocaleString()}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      {myNotifications.length > 0 && (
                        <Link to="/dashboard" onClick={() => setIsNotifOpen(false)} className="block w-full text-center py-3 bg-gray-50 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:bg-gray-100 transition">Ver todas no painel</Link>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/chat" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md font-medium transition flex items-center gap-1">
                  <div className="relative">
                    <i className="fas fa-comment-alt text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Mensagens</span>
                </Link>
                <div className="relative group ml-2">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-brand-600 focus:outline-none py-2">
                    <img 
                      src={user?.avatar || "https://i.pravatar.cc/100"} 
                      alt="Avatar" 
                      className="h-8 w-8 rounded-full border border-gray-200 object-cover" 
                    />
                    <span className="max-w-[100px] truncate font-bold">{user?.name.split(' ')[0]}</span>
                    <div className="relative">
                        <i className="fas fa-chevron-down text-[10px] opacity-50 ml-1"></i>
                        {(pendingRequestsCount > 0 || pendingKycCount > 0) && (
                            <span className={`absolute -top-4 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse ${pendingKycCount > 0 ? 'bg-red-500' : 'bg-brand-500'}`}></span>
                        )}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 hidden group-hover:block animate-fadeIn">
                    {hasAdminAccess && (
                       <Link to="/admin-master" className="flex items-center justify-between px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-black transition-colors border-b border-red-50">
                           <span className="flex items-center gap-2"><i className="fas fa-shield-alt"></i> Painel Admin</span>
                       </Link>
                    )}
                    <Link to="/dashboard" className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                        <span>Meu Painel</span>
                        {pendingRequestsCount > 0 && <span className="bg-brand-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingRequestsCount}</span>}
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">Sair</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link to="/login" className="text-brand-600 hover:text-brand-800 font-bold text-sm">Entrar</Link>
                <Link to="/register" className="bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 transition font-bold text-sm shadow-sm">
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-brand-600 relative">
              <i className="fas fa-bars text-xl"></i>
              {(unreadCount > 0 || pendingRequestsCount > 0 || pendingKycCount > 0 || unreadNotifCount > 0) && (
                <span className="absolute top-2 right-2 bg-red-600 w-3 h-3 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={closeMenu} />
      <div className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <Logo className="h-12" />
          <button onClick={closeMenu} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500"><i className="fas fa-times text-xl"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {user && (
            <div className="mb-6 p-4 bg-brand-50 rounded-2xl flex items-center gap-3">
               <img src={user.avatar || "https://i.pravatar.cc/100"} alt="" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
               <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-brand-700 truncate">{user.jobTitle || user.role}</p>
               </div>
            </div>
          )}
          {hasAdminAccess && (
             <Link to="/admin-master" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-black bg-red-50 transition-colors">
               <i className="fas fa-shield-alt"></i> Painel Admin
             </Link>
          )}
          <Link to="/search" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-brand-50 transition-colors">
            <i className="fas fa-search opacity-50"></i> Explorar
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/add-item" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-brand-50 transition-colors">
                <i className="fas fa-plus-circle opacity-50"></i> Anunciar Item
              </Link>
              <Link to="/chat" onClick={closeMenu} className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-brand-50 transition-colors">
                <div className="flex items-center gap-3"><i className="fas fa-comment-alt opacity-50"></i> Mensagens</div>
                {unreadCount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
              <Link to="/dashboard" onClick={closeMenu} className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-brand-50 transition-colors">
                <div className="flex items-center gap-3"><i className="fas fa-th-large opacity-50"></i> Meu Painel</div>
                {pendingRequestsCount > 0 && <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequestsCount}</span>}
              </Link>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition-colors">
                  <i className="fas fa-sign-out-alt opacity-50"></i> Sair
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-3">
              <Link 
                to="/login" 
                onClick={closeMenu} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-600 font-bold bg-brand-50 transition-colors"
              >
                <i className="fas fa-sign-in-alt"></i> Fazer Login
              </Link>
              <Link 
                to="/register" 
                onClick={closeMenu} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white font-bold bg-brand-600 shadow-md transition-colors"
              >
                <i className="fas fa-user-plus"></i> Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
