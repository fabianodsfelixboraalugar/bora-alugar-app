
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { VerificationStatus } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { StarRating } from '../components/StarRating';
import { BackButton } from '../components/BackButton';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getUserById, deleteUser } = useAuth();
  const { reviews, items, deleteUserData } = useData();
  const [isDeleting, setIsDeleting] = useState(false);

  const profileUser = getUserById(id || '');
  const userReviews = reviews.filter(r => r.reviewedId === id);
  const userItems = items.filter(i => i.ownerId === id);

  if (!profileUser) {
    return (
      <div className="p-8 text-center font-bold">
        Usuário não encontrado ou já excluído.
      </div>
    );
  }

  const isVerified = profileUser.verificationStatus === VerificationStatus.VERIFIED;
  const isAdmin = user?.role === 'ADMIN';

  const handleDeleteProfile = async () => {
    if (profileUser.email === 'fabianodsfelix@gmail.com') {
      alert("A conta Master principal é protegida e não pode ser excluída.");
      return;
    }
    
    const confirmMsg = `BLOQUEIO DEFINITIVO: Deseja realmente excluir permanentemente o acesso de ${profileUser.name.toUpperCase()}? Este membro será desconectado e seu e-mail será invalidado no sistema.`;
    
    if (window.confirm(confirmMsg)) {
      if (window.confirm(`CONFIRMAÇÃO FINAL: Todos os anúncios e mensagens de ${profileUser.name} também serão removidos do banco de dados. Confirmar?`)) {
        try {
          setIsDeleting(true);
          
          // 1. Remove do banco de dados (AuthContext) e aguarda confirmação
          await deleteUser(profileUser.id);
          
          // 2. Limpa dados associados (DataContext)
          deleteUserData(profileUser.id); 
          
          alert("O acesso do membro foi revogado e seus dados foram excluídos definitivamente.");
          
          // 3. Redireciona para o Painel Administrativo conforme solicitado
          navigate('/admin-master', { replace: true });
        } catch (error) {
          console.error("Erro ao deletar usuário:", error);
          alert("Erro ao processar exclusão. Verifique sua conexão local.");
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  const profileNameUpper = profileUser.name.split(' ')[0].toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-6">
        <BackButton label="Voltar" />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden bg-gray-50">
              <img 
                src={profileUser.avatar || "https://i.pravatar.cc/150"} 
                alt={profileUser.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                <i className="fas fa-check"></i>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            {profileUser.name}
          </h1>
          
          <div className="flex flex-col items-center gap-3 mb-6">
            <TrustBadge stats={profileUser.trustStats} showScore={true} />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Membro desde {profileUser.joinedDate} • {profileUser.city}, {profileUser.state || 'SISTEMA'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 w-full border-t border-gray-50 pt-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900">{profileUser.trustStats?.completedTransactions || 0}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Aluguéis</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-brand-600">{profileUser.trustStats?.avgRatingAsOwner || 5}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Média</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900">{userItems.length}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Anúncios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 px-4">
          <i className="fas fa-star text-yellow-400"></i> Avaliações ({userReviews.length})
        </h2>

        {userReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center text-gray-400 italic shadow-sm">
            Nenhuma avaliação recebida ainda.
          </div>
        ) : (
          <div className="grid gap-4">
            {userReviews.map((rev) => (
              <div key={rev.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/100?u=${rev.reviewerId}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{rev.reviewerName}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(rev.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StarRating rating={rev.rating} size="sm" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
         <button 
           onClick={() => navigate(`/chat?with=${profileUser.id}`)}
           className="w-full md:w-auto bg-[#58B83F] hover:bg-[#4aa135] text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100/40 transition transform active:scale-95 uppercase tracking-widest text-xs"
           style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}
         >
           CONVERSAR COM {profileNameUpper}
         </button>
         
         {isAdmin && profileUser.email !== 'fabianodsfelix@gmail.com' && (
           <button 
             onClick={handleDeleteProfile}
             disabled={isDeleting}
             className="w-full md:w-auto bg-white text-red-600 font-black py-4 px-10 rounded-2xl shadow-[0_10px_30px_-5px_rgba(220,38,38,0.25)] hover:shadow-[0_15px_35px_-5px_rgba(220,38,38,0.35)] transition transform active:scale-95 uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 border border-red-50"
           >
             {isDeleting ? (
               <i className="fas fa-spinner fa-spin"></i>
             ) : (
               <i className="fas fa-user-minus text-red-500"></i>
             )}
             EXCLUIR MEMBRO
           </button>
         )}
      </div>
    </div>
  );
};
