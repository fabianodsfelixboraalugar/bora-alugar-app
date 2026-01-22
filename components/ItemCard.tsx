
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Item, VerificationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, getUserById } = useAuth();
  
  const owner = getUserById(item.ownerId);
  const isVerified = owner?.verificationStatus === VerificationStatus.VERIFIED;
  const hasVideo = !!item.videoUrl;

  const handleContactOwner = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate(`/chat?with=${item.ownerId}&item=${item.id}`);
  };

  return (
    <div className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1">
      <Link to={`/item/${item.id}`} className="block relative">
        <div className="aspect-[4/3] overflow-hidden bg-gray-50">
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
          
          {/* Badge de Categoria */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black text-brand-600 shadow-sm z-10 uppercase tracking-widest border border-brand-100">
            {item.category}
          </div>

          {/* Indicador de Vídeo */}
          {hasVideo && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 z-10 border border-white/20">
              <i className="fas fa-play text-[8px]"></i> VÍDEO
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-black text-gray-900 line-clamp-1 mb-1 leading-tight">{item.title}</h3>
        
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight truncate">{item.city}</p>
          {isVerified && (
            <div className="flex items-center gap-1 bg-brand-50 text-brand-600 text-[8px] px-1.5 py-0.5 rounded-lg border border-brand-100 font-black uppercase tracking-tighter" title="Usuário Verificado">
              <i className="fas fa-check-circle"></i> Verificado
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-end">
          <div>
            <span className="text-2xl font-black text-brand-500">R$ {item.pricePerDay}</span>
            <span className="text-[9px] text-gray-400 font-black uppercase ml-1">/ dia</span>
          </div>
          <button onClick={handleContactOwner} className="bg-gray-50 hover:bg-brand-500 hover:text-white text-brand-600 w-10 h-10 rounded-2xl transition flex items-center justify-center border border-brand-50">
            <i className="fas fa-comment-dots"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
