
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    cpf: user.cpf || '',
    zipCode: user.zipCode || '',
    address: user.address || '',
    addressNumber: user.addressNumber || '',
    complement: user.complement || '',
    neighborhood: user.neighborhood || '',
    city: user.city || '',
    state: user.state || '',
    avatar: user.avatar || ''
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GENERIC_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCEP(e.target.value);
    setFormData(prev => ({ ...prev, zipCode: maskedValue }));

    const cleanCep = maskedValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setIsProcessingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório';
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de e-mail inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const inputStyle = (hasError?: boolean) => `
    w-full bg-white border ${hasError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus:border-brand-500'} 
    rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-2 
    focus:ring-brand-500/20 outline-none transition-all shadow-sm
  `;

  const labelStyle = "block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 leading-none">Editar Perfil</h3>
            <i className="fas fa-edit text-brand-500 text-sm"></i>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50 relative">
                  {isProcessingPhoto ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                      <i className="fas fa-circle-notch fa-spin text-brand-600 text-xl"></i>
                    </div>
                  ) : (
                    <img 
                      src={formData.avatar || GENERIC_AVATAR} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-camera text-white text-xl"></i>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-4">
              {/* Nome e Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Nome Completo</label>
                  <input 
                    type="text"
                    className={inputStyle(!!errors.name)}
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {errors.name && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelStyle}>E-mail</label>
                  <input 
                    type="email"
                    className={inputStyle(!!errors.email)}
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {errors.email && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.email}</p>}
                </div>
              </div>

              {/* CPF e CEP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>CPF</label>
                  <input 
                    type="text"
                    maxLength={14}
                    className={inputStyle()}
                    value={formData.cpf}
                    onChange={e => setFormData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelStyle + " flex justify-between items-center"}>
                    CEP
                    {isLoadingCep && <i className="fas fa-sync-alt fa-spin text-brand-500"></i>}
                  </label>
                  <input 
                    type="text"
                    maxLength={9}
                    className={inputStyle()}
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              {/* Logradouro */}
              <div>
                <label className={labelStyle}>Logradouro (Rua/Av)</label>
                <input 
                  type="text"
                  className={inputStyle()}
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Numero e Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Número</label>
                  <input 
                    type="text"
                    className={inputStyle()}
                    value={formData.addressNumber}
                    onChange={e => setFormData(prev => ({ ...prev, addressNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Complemento</label>
                  <input 
                    type="text"
                    className={inputStyle()}
                    value={formData.complement}
                    onChange={e => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bairro, Cidade e UF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                <div>
                  <label className={labelStyle}>Bairro</label>
                  <input 
                    type="text"
                    className={inputStyle()}
                    value={formData.neighborhood}
                    onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Cidade</label>
                  <input 
                    type="text"
                    className={inputStyle()}
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelStyle}>UF</label>
                  <input 
                    type="text"
                    maxLength={2}
                    className={inputStyle() + " uppercase"}
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer inside form to handle submit correctly */}
          <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-white transition active:scale-95 shadow-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isProcessingPhoto}
              className="flex-1 px-4 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 transition transform active:scale-95 disabled:opacity-50"
            >
              {isProcessingPhoto ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Salvar Tudo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
