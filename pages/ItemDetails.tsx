
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Rental, RentalStatus, VerificationStatus, ItemStatus } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { BackButton } from '../components/BackButton';
import { StarRating } from '../components/StarRating';

export const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, addRental, reviews, checkItemAvailability } = useData();
  const { user, isAuthenticated, getUserById } = useAuth();
  
  const item = getItemById(id || '');
  const owner = item ? getUserById(item.ownerId) : null;
  const isOwnerVerified = owner?.verificationStatus === VerificationStatus.VERIFIED;
  const isMyItem = user && item && user.id === item.ownerId;

  const itemReviews = useMemo(() => 
    reviews.filter(r => r.itemId === id && r.role === 'RENTER'), 
    [reviews, id]
  );

  const [activeMedia, setActiveMedia] = useState(0); // 0 to images.length-1 for images, images.length for video
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);

  // Verificação de indisponibilidade geral (Manual ou Manutenção)
  const isGeneralUnavailable = useMemo(() => {
    if (!item) return true;
    return !item.available || item.status === ItemStatus.MAINTENANCE;
  }, [item]);

  // Verificação de disponibilidade em tempo real considerando aluguéis e status geral
  const isAvailableForSelectedDates = useMemo(() => {
    if (!item) return false;
    if (isGeneralUnavailable) return false;
    if (!startDate || !endDate) return true;
    return checkItemAvailability(item.id, startDate, endDate);
  }, [item, startDate, endDate, checkItemAvailability, isGeneralUnavailable]);

  if (!item || !owner) return <div className="p-8 text-center font-bold">Item não encontrado.</div>;

  const getVideoId = (url: string) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    
    const ytMatch = url.match(youtubeRegex);
    if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
    
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
    
    return null;
  };

  const videoData = getVideoId(item.videoUrl || '');

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let total = diffDays * item.pricePerDay;
    if (deliveryMethod === 'DELIVERY') total += item.deliveryConfig.fee;
    return total;
  };

  const totalPrice = calculateTotal();

  const handleRentRequest = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isMyItem) { alert("Você não pode alugar seu próprio item."); return; }
    
    if (isGeneralUnavailable) {
      alert("Este item está marcado como indisponível ou em manutenção no momento.");
      return;
    }

    if (!startDate || !endDate) { alert("Selecione as datas."); return; }
    
    if (!isAvailableForSelectedDates) {
      alert("Desculpe, este item já está alugado nas datas selecionadas. Por favor, escolha outro período.");
      return;
    }

    if (deliveryMethod === 'DELIVERY' && !deliveryAddress) { alert("Informe o endereço de entrega."); return; }
    
    if (!contractAccepted) {
      setShowContractModal(true);
      return;
    }

    executeRental();
  };

  const executeRental = () => {
    const newRental: Rental = {
      id: 'rent_' + Date.now(),
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images[0],
      renterId: user!.id,
      ownerId: item.ownerId,
      startDate,
      endDate,
      totalPrice,
      status: RentalStatus.PENDING,
      createdAt: new Date().toISOString(),
      deliveryInfo: {
        method: deliveryMethod,
        fee: deliveryMethod === 'DELIVERY' ? item.deliveryConfig.fee : 0,
        address: deliveryMethod === 'DELIVERY' ? deliveryAddress : undefined
      },
      contractAccepted: true
    };

    addRental(newRental);
    alert("Solicitação enviada! Aguarde a confirmação do proprietário.");
    navigate('/dashboard');
  };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      
      {showContractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Contrato de Aluguel</h3>
                <button onClick={() => setShowContractModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
             </div>
             <div className="p-8 overflow-y-auto flex-1 space-y-4">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {item.contractTerms || "O proprietário não definiu termos específicos extras para este contrato. Valem as regras gerais da plataforma."}
                   </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-bold leading-relaxed">
                        Ao clicar em aceitar, você concorda que o proprietário poderá acionar a plataforma ou medidas legais em caso de descumprimento dos termos acima.
                    </p>
                </div>
             </div>
             <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-4">
                <button 
                  onClick={() => { setContractAccepted(true); setShowContractModal(false); }}
                  className="w-full bg-[#58B83F] hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase text-xs tracking-widest"
                >
                  Eu li e aceito os termos
                </button>
                <button 
                  onClick={() => setShowContractModal(false)}
                  className="w-full bg-white text-gray-500 font-bold py-4 rounded-2xl border border-gray-200 uppercase text-xs tracking-widest"
                >
                  Agora não
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="mb-6 relative flex items-center min-h-[56px]">
        <div className="z-10">
          <div className="flex gap-2">
            <BackButton label="Voltar" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-[0.2em] truncate max-w-[50%] text-center">
            {item.title}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="aspect-[16/10] w-full bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                {activeMedia < item.images.length ? (
                    <img src={item.images[activeMedia]} className="w-full h-full object-cover transition-all duration-500" alt={item.title} />
                ) : (
                    videoData && (
                        <iframe
                            className="w-full h-full"
                            src={videoData.type === 'youtube' 
                                ? `https://www.youtube.com/embed/${videoData.id}?autoplay=1` 
                                : `https://player.vimeo.com/video/${videoData.id}?autoplay=1`}
                            title="Item Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )
                )}
            </div>
            
            <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
                {item.images.map((img, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setActiveMedia(idx)}
                        className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeMedia === idx ? 'border-brand-500 scale-95 shadow-md' : 'border-transparent opacity-60'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                ))}
                
                {/* Thumbnail do Vídeo na Galeria */}
                {videoData && (
                    <button 
                        onClick={() => setActiveMedia(item.images.length)}
                        className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${activeMedia === item.images.length ? 'border-brand-500 scale-95 shadow-md' : 'border-transparent opacity-60'}`}
                    >
                        <img 
                            src={videoData.type === 'youtube' 
                                ? `https://img.youtube.com/vi/${videoData.id}/mqdefault.jpg` 
                                : "https://cdn-icons-png.flaticon.com/512/3670/3670163.png"} 
                            className="w-full h-full object-cover" 
                            alt="Video Thumbnail" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <i className="fas fa-play text-white text-xs drop-shadow-md"></i>
                        </div>
                    </button>
                )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                <i className="fas fa-align-left text-brand-500"></i> Descrição
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Seção de Vídeo (Opcional - Mantida para complementar) */}
          {videoData && (
             <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 animate-fadeIn">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-video text-brand-500"></i> Demonstração em Vídeo
                </h3>
                <div className="rounded-3xl overflow-hidden aspect-video bg-black shadow-lg">
                    <iframe
                        className="w-full h-full"
                        src={videoData.type === 'youtube' 
                            ? `https://www.youtube.com/embed/${videoData.id}` 
                            : `https://player.vimeo.com/video/${videoData.id}`}
                        title="Item Video Full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
             </div>
          )}

          <div id="reviews-section" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <i className="fas fa-star text-yellow-400"></i> Avaliações do Item ({itemReviews.length})
              </h2>
              {itemReviews.length > 0 && (
                <button 
                  onClick={scrollToReviews}
                  className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 hover:bg-yellow-100 transition"
                >
                   <StarRating rating={item.rating} size="sm" />
                   <span className="text-sm font-black text-yellow-700">{item.rating}</span>
                </button>
              )}
            </div>

            {itemReviews.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <i className="far fa-comment-dots text-gray-200 text-3xl mb-3"></i>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Este item ainda não possui avaliações.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {itemReviews.map((rev) => (
                  <div key={rev.id} className="p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://i.pravatar.cc/100?u=${rev.reviewerId}`} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover border border-white shadow-sm" 
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-none mb-1">
                            {rev.isAnonymous ? 'Usuário Anônimo' : rev.reviewerName}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {new Date(rev.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={rev.rating} size="sm" />
                    </div>

                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                      
                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-white text-brand-600 rounded-lg border border-brand-50 shadow-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl sticky top-24">
            
            {/* --- MINIATURA DO VÍDEO NO TOPO DO CARD DE SOLICITAÇÃO (CONFORME SCREENSHOT) --- */}
            {videoData && (
               <div className="mb-6 group cursor-pointer animate-fadeIn" onClick={() => setActiveMedia(item.images.length)}>
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100 border border-gray-100 shadow-sm ring-2 ring-brand-500/20 group-hover:ring-brand-500 transition-all duration-300">
                      <img 
                          src={videoData.type === 'youtube' 
                              ? `https://img.youtube.com/vi/${videoData.id}/mqdefault.jpg` 
                              : "https://vignette.wikia.nocookie.net/video-game-ad-database/images/e/e5/Vimeo_Logo.png"} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt="Miniatura do Vídeo" 
                      />
                      {/* Overlay do Botão de Play */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-300">
                              <i className="fas fa-play text-brand-500 text-xl ml-1"></i>
                          </div>
                      </div>
                      {/* Badge Indicadora */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-brand-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-sm border border-brand-400">DEMONSTRAÇÃO EM VÍDEO</span>
                      </div>
                  </div>
               </div>
            )}

            <div className="flex justify-between items-start mb-4">
               <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1 truncate">{item.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                      <i className="fas fa-map-marker-alt text-brand-500 mr-1"></i> {item.city}
                    </p>
                    {item.reviewCount > 0 && (
                      <button 
                        onClick={scrollToReviews}
                        className="flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition shadow-sm group"
                        title="Ver todas as avaliações"
                      >
                        <StarRating rating={item.rating} size="sm" className="group-hover:scale-105 transition-transform" />
                        <span className="text-[10px] font-bold text-yellow-700">{item.rating} ({item.reviewCount})</span>
                      </button>
                    )}
                  </div>
               </div>
               <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-brand-600 leading-none">R$ {item.pricePerDay}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">por dia</p>
               </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-3xl mb-8 flex items-center justify-between border border-gray-100 shadow-sm hover:border-brand-200 transition group relative overflow-hidden">
                <button 
                  onClick={() => navigate(`/profile/${owner.id}`)}
                  className="flex items-center gap-3 overflow-hidden flex-1 text-left z-10"
                >
                   <img src={owner.avatar || "https://i.pravatar.cc/100"} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform" alt="" />
                   <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 leading-none flex items-center gap-1.5 mb-1.5 truncate group-hover:text-brand-600 transition-colors">
                        {owner.name}
                        {isOwnerVerified && <i className="fas fa-check-circle text-brand-500 text-[10px]"></i>}
                      </h4>
                      <div className="flex flex-col gap-1">
                        <TrustBadge stats={owner.trustStats} showScore={true} />
                      </div>
                   </div>
                </button>
                {!isMyItem && (
                    <button onClick={() => navigate(`/chat?with=${owner.id}`)} className="bg-white text-brand-600 p-3 rounded-2xl shadow-sm border border-brand-50 hover:bg-brand-500 hover:text-white transition flex-shrink-0 ml-3 z-20">
                    <i className="fas fa-comment-dots text-lg"></i>
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {!isMyItem ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Início</label>
                            <input type="date" disabled={isGeneralUnavailable} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-50" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Fim</label>
                            <input type="date" disabled={isGeneralUnavailable} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-500 disabled:opacity-50" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || new Date().toISOString().split('T')[0]} />
                        </div>
                        </div>

                        {isGeneralUnavailable && (
                          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-fadeIn">
                            <p className="text-xs text-orange-600 font-bold flex items-center gap-2">
                              <i className="fas fa-tools"></i>
                              Este item está temporariamente indisponível ou em manutenção.
                            </p>
                          </div>
                        )}

                        {!isAvailableForSelectedDates && !isGeneralUnavailable && startDate && endDate && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-fadeIn">
                            <p className="text-xs text-red-600 font-bold flex items-center gap-2">
                              <i className="fas fa-calendar-times"></i>
                              Item indisponível nas datas selecionadas.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Como deseja receber?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeliveryMethod('PICKUP')} disabled={isGeneralUnavailable} className={`p-4 rounded-2xl border-2 transition text-left ${deliveryMethod === 'PICKUP' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50 opacity-60'} ${isGeneralUnavailable ? 'cursor-not-allowed' : ''}`}>
                                <i className="fas fa-walking text-brand-600 mb-2"></i>
                                <p className="text-xs font-bold text-gray-900 leading-none">Retirar no Local</p>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-black">Grátis</p>
                            </button>
                            <button 
                                disabled={!item.deliveryConfig.available || isGeneralUnavailable}
                                onClick={() => setDeliveryMethod('DELIVERY')} 
                                className={`p-4 rounded-2xl border-2 transition text-left ${deliveryMethod === 'DELIVERY' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50 opacity-60'} ${(!item.deliveryConfig.available || isGeneralUnavailable) ? 'cursor-not-allowed grayscale' : ''}`}
                            >
                                <i className="fas fa-truck text-brand-600 mb-2"></i>
                                <p className="text-xs font-bold text-gray-900 leading-none">Entrega</p>
                                <p className="text-[9px] text-brand-500 mt-1 uppercase font-black">R$ {item.deliveryConfig.fee}</p>
                            </button>
                        </div>
                        </div>

                        {deliveryMethod === 'DELIVERY' && !isGeneralUnavailable && (
                        <div className="animate-fadeIn">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Endereço de Entrega</label>
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-500" placeholder="Rua, Número, Complemento..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                        </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                           <input 
                              type="checkbox" 
                              id="terms-check" 
                              disabled={isGeneralUnavailable}
                              checked={contractAccepted} 
                              onChange={(e) => setContractAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#58B83F] rounded border-gray-300 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
                           />
                           <label htmlFor="terms-check" className="text-[10px] font-bold text-gray-600 uppercase cursor-pointer select-none">
                              Li e aceito os <button onClick={() => setShowContractModal(true)} disabled={isGeneralUnavailable} className="text-[#58B83F] underline disabled:opacity-50">termos do contrato</button>
                           </label>
                        </div>

                        {totalPrice > 0 && isAvailableForSelectedDates && !isGeneralUnavailable && (
                        <div className="p-6 bg-brand-500 rounded-3xl text-white flex justify-between items-center shadow-lg shadow-brand-100 animate-fadeIn">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Valor Total</p>
                                <p className="text-3xl font-black">R$ {totalPrice}</p>
                            </div>
                            <i className="fas fa-receipt text-2xl opacity-40"></i>
                        </div>
                        )}

                        <button 
                          onClick={handleRentRequest} 
                          disabled={isGeneralUnavailable || (!isAvailableForSelectedDates && !!startDate && !!endDate)}
                          className={`w-full bg-secondary-500 hover:bg-secondary-600 text-white font-black py-5 rounded-[2rem] shadow-xl transition transform active:scale-[0.98] uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Solicitar Aluguel
                        </button>
                    </>
                ) : (
                    <div className="p-6 border-2 border-brand-100 rounded-[2rem] bg-brand-50 flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm">
                            <i className="fas fa-user-edit text-xl"></i>
                        </div>
                        <div>
                            <p className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Você é o proprietário</p>
                            <p className="text-[10px] text-gray-500 font-bold">Deseja alterar as informações ou fotos deste anúncio?</p>
                        </div>
                        <button 
                            onClick={() => navigate(`/add-item?edit=${item.id}`)}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl shadow-md transition transform active:scale-95 uppercase text-xs tracking-widest"
                        >
                            Editar Anúncio
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
