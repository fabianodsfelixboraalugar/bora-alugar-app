
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Category, Item, VerificationStatus, UserPlan } from '../types';
import { BackButton } from '../components/BackButton';
import { VerificationModal } from '../components/VerificationModal';
import { UpgradeModal } from '../components/UpgradeModal';

export const AddItem: React.FC = () => {
  const { addItem, updateItem, getItemById, items } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showKYC, setShowKYC] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const editId = searchParams.get('edit');

  // Cálculo de limite do plano
  const userItemsCount = items.filter(i => i.ownerId === user?.id).length;
  const planLimit = user?.plan === UserPlan.FREE ? 1 : user?.plan === UserPlan.BASIC ? 5 : 999;
  const limitReached = !editId && userItemsCount >= planLimit;

  const defaultContract = `1. O locatário compromete-se a devolver o item no mesmo estado em que o recebeu.\n2. Em caso de danos, o locatário arcará com os custos de reparo ou reposição.\n3. O atraso na devolução acarretará em multa diária equivalente ao valor da diária.\n4. O uso deve ser estritamente para os fins destinados.`;

  const [formData, setFormData] = useState({
    title: '',
    category: Category.OTHER,
    description: '',
    contractTerms: defaultContract,
    images: [] as string[],
    videoUrl: '',
    pricePerDay: '',
    city: user?.city || '',
    state: user?.state || 'SP',
    deliveryAvailable: false,
    deliveryFee: '0',
    deliveryRadius: '10'
  });

  useEffect(() => {
    if (editId) {
      const existingItem = getItemById(editId);
      if (existingItem && (existingItem.ownerId === user?.id)) {
        setFormData({
          title: existingItem.title,
          category: existingItem.category,
          description: existingItem.description,
          contractTerms: existingItem.contractTerms || defaultContract,
          images: existingItem.images,
          videoUrl: existingItem.videoUrl || '',
          pricePerDay: existingItem.pricePerDay.toString(),
          city: existingItem.city,
          state: existingItem.state,
          deliveryAvailable: existingItem.deliveryConfig.available,
          deliveryFee: existingItem.deliveryConfig.fee.toString(),
          deliveryRadius: existingItem.deliveryConfig.maxDistanceKm.toString()
        });
      }
    }
  }, [editId, getItemById, user?.id]);

  const isPriceRestricted = Number(formData.pricePerDay) > 100 && user?.verificationStatus !== VerificationStatus.VERIFIED;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - formData.images.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // VERIFICAÇÃO DE LIMITE DE PLANO
    if (limitReached) {
        setShowUpgrade(true);
        return;
    }

    const missingFields = [];
    if (!formData.title.trim()) missingFields.push("Título do Anúncio");
    if (!formData.pricePerDay.trim() || Number(formData.pricePerDay) <= 0) missingFields.push("Preço da Diária");
    if (!formData.description.trim()) missingFields.push("Descrição");
    if (formData.images.length === 0) missingFields.push("Pelo menos 1 Foto");

    if (missingFields.length > 0) {
      alert(`ATENÇÃO: Estão faltando as seguintes informações:\n\n• ${missingFields.join('\n• ')}\n\nPor favor, preencha para continuar.`);
      return;
    }

    if (isPriceRestricted) {
      alert("ERRO DE SEGURANÇA: Itens acima de R$ 100,00 exigem conta verificada (KYC). Por favor, ajuste o preço ou valide seu perfil no painel.");
      return;
    }

    const itemData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      contractTerms: formData.contractTerms,
      images: formData.images,
      videoUrl: formData.videoUrl,
      pricePerDay: parseFloat(formData.pricePerDay),
      deliveryConfig: {
        available: formData.deliveryAvailable,
        fee: parseFloat(formData.deliveryFee),
        maxDistanceKm: parseInt(formData.deliveryRadius),
        timeFrame: 'Combinar com proprietário'
      },
      city: formData.city,
      state: formData.state,
      available: true
    };

    if (editId) {
      updateItem(editId, itemData);
      alert("Alterações salvas com sucesso!");
    } else {
      const newItem: Item = {
        ...itemData,
        id: 'i_' + Date.now(),
        ownerId: user.id,
        ownerName: user.name,
        createdAt: new Date().toISOString(),
        rating: 0,
        reviewCount: 0,
      } as any;
      addItem(newItem);
      alert("Anúncio publicado com sucesso!");
    }
    
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen bg-gray-50/30">
      {showKYC && <VerificationModal onClose={() => setShowKYC(false)} />}
      {showUpgrade && <UpgradeModal currentPlan={user?.plan || UserPlan.FREE} itemCount={userItemsCount} onClose={() => setShowUpgrade(false)} />}
      
      <div className="mb-10 relative flex items-center min-h-[56px]">
        <div className="z-10">
          <BackButton label="Voltar" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-sm md:text-xl font-black text-gray-900 uppercase tracking-[0.2em] truncate max-w-[50%] text-center">
            {editId ? formData.title : 'Anunciar Item'}
          </h2>
        </div>
      </div>

      {limitReached && (
        <div className="mb-8 p-6 bg-brand-50 border-2 border-brand-200 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                    <i className="fas fa-lock text-xl"></i>
                </div>
                <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Limite atingido</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sua conta {user?.plan} permite apenas {planLimit} anúncio ativo.</p>
                </div>
            </div>
            <button 
                onClick={() => setShowUpgrade(true)}
                className="bg-brand-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition transform active:scale-95 whitespace-nowrap"
            >
                Fazer Upgrade Agora
            </button>
        </div>
      )}

      <div className={`bg-white rounded-[3rem] shadow-sm border border-gray-100 p-8 md:p-12 overflow-hidden transition-opacity ${limitReached ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Seção de Mídia */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Galeria Visual ({formData.images.length}/5)</label>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button 
                            type="button" 
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
                {formData.images.length < 5 && (
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-[1.5rem] border-2 border-dashed border-brand-200 flex flex-col items-center justify-center text-brand-500 hover:bg-brand-50 hover:border-brand-500 transition-all bg-brand-50/10"
                    >
                        <i className="fas fa-camera text-xl mb-2"></i>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Add Foto</span>
                    </button>
                )}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />

             {/* Campo de Vídeo */}
             <div className="pt-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Link de Vídeo (YouTube/Vimeo)</label>
                <div className="relative mb-4">
                    <i className="fab fa-youtube absolute left-5 top-1/2 -translate-y-1/2 text-brand-500 text-lg"></i>
                    <input 
                        type="url" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] pl-14 pr-5 py-4 outline-none focus:ring-2 focus:ring-brand-500 transition text-sm font-medium" 
                        placeholder="Cole a URL aqui..." 
                        value={formData.videoUrl} 
                        onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                    />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Título do Anúncio</label>
                <input className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 transition font-bold" placeholder="Ex: Câmera Canon 80D" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 font-bold appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Preço da Diária</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-brand-600">R$</span>
                  <input type="number" className={`w-full bg-gray-50 border rounded-[1.5rem] pl-14 pr-6 py-4 outline-none transition font-black text-lg ${isPriceRestricted ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-brand-500'}`} value={formData.pricePerDay} onChange={e => setFormData({...formData, pricePerDay: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição Detalhada</label>
              <textarea className="w-full bg-gray-50 border border-gray-200 rounded-[2rem] px-6 py-5 outline-none focus:ring-2 focus:ring-brand-500 h-[215px] resize-none font-medium leading-relaxed" placeholder="Descreva o estado, acessórios, voltagem..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100">
             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Termos do Contrato de Aluguel</label>
             <p className="text-[10px] text-gray-400 font-bold mb-4 ml-1">Estes termos serão apresentados ao locatário para aceite obrigatório antes do aluguel.</p>
             <textarea 
               className="w-full bg-gray-50 border border-gray-200 rounded-[2rem] px-6 py-5 outline-none focus:ring-2 focus:ring-brand-500 h-[150px] resize-none font-medium leading-relaxed" 
               placeholder="Defina aqui as regras para seu item..." 
               value={formData.contractTerms} 
               onChange={e => setFormData({...formData, contractTerms: e.target.value})} 
             />
          </div>

          <div className="p-8 md:p-10 bg-gray-50/50 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-1">Configurações de Logística</h3>
                <p className="text-xs text-gray-400 font-medium">Oferecer entrega ou apenas retirada?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.deliveryAvailable} onChange={e => setFormData({...formData, deliveryAvailable: e.target.checked})} />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>

            {formData.deliveryAvailable && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Taxa de Entrega (R$)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 font-bold" value={formData.deliveryFee} onChange={e => setFormData({...formData, deliveryFee: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Raio Máximo (km)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-brand-500 font-bold" value={formData.deliveryRadius} onChange={e => setFormData({...formData, deliveryRadius: e.target.value})} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <button 
              type="submit" 
              className="w-full md:w-auto md:min-w-[400px] py-6 rounded-[3rem] font-black text-white uppercase tracking-[0.15em] transition shadow-xl active:scale-[0.98] bg-[#58B83F] hover:bg-[#4aa135] shadow-[#58B83F]/20"
            >
              {editId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR ANÚNCIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
