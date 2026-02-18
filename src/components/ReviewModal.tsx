import React, { useState } from 'react';
import { Rental, User } from '../types';
import { StarRating } from './StarRating';

interface ReviewModalProps {
  rental: Rental;
  currentUser: User;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ rental, currentUser, onClose, onSubmit }) => {
  const isOwner = currentUser.id === rental.ownerId;
  const role = isOwner ? 'OWNER' : 'RENTER';
  const targetName = isOwner ? 'Locatário(a)' : 'Locador(a) / Item';
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  
  // Criteria State
  const [criteria, setCriteria] = useState({
    communication: 0,
    pontuality: 0,
    accuracy: 0, // Only for Renter evaluating Item
    cleanliness: 0, // Only for Renter evaluating Item
    care: 0 // Only for Owner evaluating Renter
  });

  // Suggestion Tags
  const ownerTags = ['Cuidado com o item', 'Pontual', 'Boa comunicação', 'Recomendado', 'Devolução Rápida', 'Danificou Item', 'Atrasou'];
  const renterTags = ['Item Impecável', 'Conforme Anúncio', 'Anfitrião Simpático', 'Limpo', 'Problema Técnico', 'Sujeira', 'Comunicação Difícil'];
  
  const availableTags = isOwner ? ownerTags : renterTags;

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
        setTags(tags.filter(t => t !== tag));
    } else {
        if (tags.length < 3) setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
        return;
    }

    const reviewData = {
        transactionId: rental.id,
        itemId: isOwner ? undefined : rental.itemId,
        reviewerId: currentUser.id,
        reviewedId: isOwner ? rental.renterId : rental.ownerId,
        reviewerName: currentUser.name,
        role,
        rating,
        criteria,
        tags,
        comment,
        isAnonymous
    };

    onSubmit(reviewData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Avaliar Experiência</h3>
            <p className="text-sm text-gray-500">Transação: {rental.itemTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Main Rating */}
          <div className="text-center">
            <p className="text-gray-700 font-medium mb-3">Como foi sua experiência com o {targetName}?</p>
            <div className="flex justify-center">
               <StarRating rating={rating} size="lg" interactive onChange={setRating} />
            </div>
            <p className="text-sm text-brand-600 font-medium mt-2">
                {rating === 1 && "Terrível"}
                {rating === 2 && "Ruim"}
                {rating === 3 && "Razoável"}
                {rating === 4 && "Muito Bom"}
                {rating === 5 && "Excelente!"}
            </p>
          </div>

          {/* Specific Criteria */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
             <h4 className="text-sm font-bold text-gray-900 mb-2">Detalhes (Opcional)</h4>
             
             <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-600">Comunicação</span>
                 <StarRating rating={criteria.communication} size="sm" interactive onChange={(v) => setCriteria({...criteria, communication: v})} />
             </div>
             
             <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-600">Pontualidade</span>
                 <StarRating rating={criteria.pontuality} size="sm" interactive onChange={(v) => setCriteria({...criteria, pontuality: v})} />
             </div>

             {/* Dynamic Criteria */}
             {!isOwner && (
                 <>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fidelidade do Anúncio</span>
                        <StarRating rating={criteria.accuracy} size="sm" interactive onChange={(v) => setCriteria({...criteria, accuracy: v})} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Limpeza</span>
                        <StarRating rating={criteria.cleanliness} size="sm" interactive onChange={(v) => setCriteria({...criteria, cleanliness: v})} />
                    </div>
                 </>
             )}

             {isOwner && (
                 <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">Cuidado com o item</span>
                     <StarRating rating={criteria.care} size="sm" interactive onChange={(v) => setCriteria({...criteria, care: v})} />
                 </div>
             )}
          </div>

          {/* Tags */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">O que se destacou?</label>
              <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${tags.includes(tag) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
                      >
                          {tag}
                      </button>
                  ))}
              </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comentário (Público)</label>
            <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                rows={3}
                placeholder="Escreva detalhes sobre a negociação..."
                value={comment}
                onChange={e => setComment(e.target.value)}
            ></textarea>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center gap-2 pt-2">
             <input 
                type="checkbox" 
                id="anon" 
                checked={isAnonymous} 
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
             />
             <label htmlFor="anon" className="text-sm text-gray-600">Avaliar anonimamente (seu nome será ocultado)</label>
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
          >
            Enviar Avaliação
          </button>

        </form>
      </div>
    </div>
  );
};