
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import { BackButton } from '../components/BackButton';

export const Chat: React.FC = () => {
  const { user, getUserById, updateUser } = useAuth();
  const { messages, sendMessage, markAsRead, deleteMessage, deleteConversation, clearAllMessages, getItemById } = useData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialPartnerId = searchParams.get('with');
  const contextItemId = searchParams.get('item'); 
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (initialPartnerId && initialPartnerId !== user?.id) {
      setActivePartnerId(initialPartnerId);
    }
  }, [initialPartnerId, user]);

  useEffect(() => {
    if (user && activePartnerId && contextItemId) {
      const chatHistory = messages.filter(m => 
        (m.senderId === user.id && m.receiverId === activePartnerId) || 
        (m.senderId === activePartnerId && m.receiverId === user.id)
      );

      if (chatHistory.length === 0) {
        const item = getItemById(contextItemId);
        if (item) {
          sendMessage(user.id, activePartnerId, `Olá, tenho interesse em alugar seu ${item.title}. Ainda está disponível?`);
        }
      }
    }
  }, [activePartnerId, contextItemId, user, messages, getItemById, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activePartnerId]);

  if (!user) return null;

  const isBlocked = (partnerId: string) => user.blockedUserIds?.includes(partnerId);

  const conversationPartnerIds = Array.from(new Set<string>(
    messages
      .filter(m => m.senderId === user.id || m.receiverId === user.id)
      .map(m => m.senderId === user.id ? m.receiverId : m.senderId)
  ));

  if (initialPartnerId && !conversationPartnerIds.includes(initialPartnerId) && initialPartnerId !== user.id) {
    conversationPartnerIds.unshift(initialPartnerId);
  }

  const partners = conversationPartnerIds
    .map(id => {
      const partnerUser = getUserById(id);
      const lastMsg = messages
        .filter(m => (m.senderId === user.id && m.receiverId === id) || (m.senderId === id && m.receiverId === user.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      return {
        id,
        user: partnerUser || { name: 'Usuário Desconhecido', avatar: '' },
        lastMessage: lastMsg
      };
    })
    .filter(p => p.user.name.toLowerCase().includes(contactSearch.toLowerCase()))
    .sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return dateB - dateA;
    });

  const activeMessages = useMemo(() => {
    return activePartnerId 
    ? messages.filter(m => 
        (m.senderId === user.id && m.receiverId === activePartnerId) || 
        (m.senderId === activePartnerId && m.receiverId === user.id)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];
  }, [messages, activePartnerId, user.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId || isBlocked(activePartnerId)) return;
    sendMessage(user.id, activePartnerId, newMessage);
    setNewMessage('');
  };

  const handlePartnerSelect = (partnerId: string) => {
    setActivePartnerId(partnerId);
    navigate(`/chat?with=${partnerId}`, { replace: true });
    messages.filter(m => m.senderId === partnerId && m.receiverId === user.id && !m.read)
            .forEach(m => markAsRead(m.id));
  };

  const handleDeleteConversation = () => {
    if (!activePartnerId) return;
    if (window.confirm('Tem certeza que deseja apagar todo o histórico com este usuário?')) {
        deleteConversation(user.id, activePartnerId);
        setActivePartnerId(null);
        navigate('/chat');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('ATENÇÃO: Deseja realmente apagar TODAS as suas conversas? Esta ação não pode ser desfeita.')) {
        clearAllMessages(user.id);
        setActivePartnerId(null);
        navigate('/chat');
    }
  };

  const handleToggleBlock = () => {
    if (!activePartnerId) return;
    const currentBlocked = user.blockedUserIds || [];
    const isNowBlocked = isBlocked(activePartnerId);
    
    let updatedBlocked;
    if (isNowBlocked) {
        updatedBlocked = currentBlocked.filter(id => id !== activePartnerId);
        alert('Usuário desbloqueado.');
    } else {
        if (window.confirm('Deseja bloquear este usuário? Você não receberá mais mensagens dele.')) {
            updatedBlocked = [...currentBlocked, activePartnerId];
        } else return;
    }
    updateUser({ blockedUserIds: updatedBlocked });
  };

  const exportPDF = () => {
    if (!activePartnerId) return;
    const partner = getUserById(activePartnerId);
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Histórico de Conversa: ${user.name} & ${partner?.name || 'Usuário'}`, 10, 20);
    doc.setFontSize(10);
    doc.text(`Exportado em: ${new Date().toLocaleString()}`, 10, 28);
    doc.line(10, 32, 200, 32);

    let y = 40;
    activeMessages.forEach(msg => {
      const sender = msg.senderId === user.id ? user.name : partner?.name || 'Usuário';
      const date = new Date(msg.timestamp).toLocaleString();
      const text = `${sender} [${date}]: ${msg.content}`;
      
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 10, y);
      y += (splitText.length * 7);
      
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`conversa_${partner?.name || 'usuario'}.pdf`);
  };

  const contextItem = contextItemId ? getItemById(contextItemId) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <BackButton label="Voltar ao Painel" />
        <button onClick={() => navigate('/')} className="text-brand-600 font-bold flex items-center gap-1.5 hover:underline text-sm">
          <i className="fas fa-home"></i> Início
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex overflow-hidden">
        
        {/* Sidebar - Contacts */}
        <div className={`${activePartnerId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
            <h2 className="text-xl font-bold text-gray-800">Mensagens</h2>
            <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input 
                    type="text" 
                    placeholder="Buscar contatos..." 
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {partners.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <i className="far fa-comments text-4xl mb-3 text-gray-300"></i>
                <p>Nenhuma conversa encontrada.</p>
              </div>
            ) : (
              partners.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePartnerSelect(p.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition border-b border-gray-100 flex items-center gap-3 ${activePartnerId === p.id ? 'bg-brand-50 border-brand-100' : ''}`}
                >
                  <div className="relative">
                    <img 
                      src={p.user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} 
                      alt="" 
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    {isBlocked(p.id) && (
                        <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                            <i className="fas fa-ban"></i>
                        </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{p.user.name}</h4>
                      {p.lastMessage && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(p.lastMessage.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${p.lastMessage && !p.lastMessage.read && p.lastMessage.receiverId === user.id ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      {p.lastMessage ? (
                         <>
                           {p.lastMessage.senderId === user.id && <span className="text-brand-600 mr-1">Você:</span>}
                           {p.lastMessage.content}
                         </>
                      ) : (
                        <span className="italic text-brand-600">Nova conversa</span>
                      )}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-white">
              <button 
                onClick={handleClearAll}
                className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition flex items-center justify-center gap-2"
              >
                  <i className="fas fa-broom"></i> Limpar Todas as Conversas
              </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!activePartnerId ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-gray-50 relative`}>
          {activePartnerId ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setActivePartnerId(null); navigate('/chat'); }} 
                      className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 border border-gray-200 active:bg-gray-200 transition-colors"
                    >
                      <i className="fas fa-arrow-left text-sm"></i>
                    </button>
                    <img 
                        src={getUserById(activePartnerId as string)?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{getUserById(activePartnerId as string)?.name || 'Usuário'}</h3>
                    {contextItem && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img src={contextItem.images[0]} alt="" className="w-5 h-5 rounded object-cover border border-gray-100" />
                        <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">Interesse: {contextItem.title}</span>
                      </div>
                    )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={exportPDF}
                        className="p-2 text-gray-400 hover:text-brand-600 transition"
                        title="Exportar Conversa para PDF"
                    >
                        <i className="fas fa-file-pdf text-lg"></i>
                    </button>
                    <button 
                        onClick={handleToggleBlock}
                        className={`p-2 transition ${isBlocked(activePartnerId) ? 'text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                        title={isBlocked(activePartnerId) ? "Desbloquear Usuário" : "Bloquear Usuário"}
                    >
                        <i className={`fas ${isBlocked(activePartnerId) ? 'fa-user-slash' : 'fa-ban'} text-lg`}></i>
                    </button>
                    <button 
                        onClick={handleDeleteConversation}
                        className="p-2 text-gray-400 hover:text-red-600 transition"
                        title="Apagar Histórico da Conversa"
                    >
                        <i className="fas fa-trash-alt text-lg"></i>
                    </button>
                    <button 
                        onClick={() => { setActivePartnerId(null); navigate('/chat'); }}
                        className="hidden md:flex p-2 text-gray-400 hover:text-gray-600 ml-2"
                        title="Fechar Chat"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                {activeMessages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 mr-2 text-gray-300 hover:text-red-400 transition text-xs flex items-center"
                            title="Apagar mensagem"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative animate-fadeIn ${
                        isMe 
                          ? 'bg-brand-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                          <span className="text-[9px]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {isMe && (
                              <span className="text-[10px]">
                                {msg.read ? (
                                    <i className="fas fa-check-double text-blue-300" title="Lida"></i>
                                ) : (
                                    <i className="fas fa-check" title="Enviada"></i>
                                )}
                              </span>
                          )}
                        </div>
                      </div>
                      {isMe && (
                        <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 ml-2 text-gray-300 hover:text-red-400 transition text-xs flex items-center"
                            title="Apagar minha mensagem"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isBlocked(activePartnerId) ? (
                  <div className="p-4 bg-red-50 text-red-600 text-center text-sm font-medium border-t border-red-100">
                      Você bloqueou este usuário. Desbloqueie para enviar mensagens.
                  </div>
              ) : (
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                    <button type="button" className="text-gray-400 hover:text-brand-600 px-2 transition">
                        <i className="fas fa-paperclip"></i>
                    </button>
                    <input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-comments text-4xl text-gray-300"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">Selecione uma conversa</h3>
              <p className="text-center max-w-md text-sm">Escolha um contato à esquerda ou inicie uma nova conversa através da página do item.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
