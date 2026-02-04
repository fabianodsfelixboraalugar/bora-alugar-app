
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    taxId: '',
    userType: UserType.PF,
    zipCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    password: '',
    confirmPassword: ''
  });

  const { register, isValidTaxId } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // Email Suggestions State
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailInputRef = useRef<HTMLDivElement>(null);
  
  const commonDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'live.com'];

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });

    if (value.includes('@')) {
      const [localPart, domainPart] = value.split('@');
      const filtered = commonDomains
        .filter(d => d.startsWith(domainPart.toLowerCase()))
        .map(d => `${localPart}@${d}`);
      
      setEmailSuggestions(filtered);
      setShowEmailSuggestions(filtered.length > 0);
    } else {
      setShowEmailSuggestions(false);
    }
  };

  const selectEmailSuggestion = (suggestion: string) => {
    setFormData({ ...formData, email: suggestion });
    setShowEmailSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailInputRef.current && !emailInputRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const maskTaxId = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (formData.userType === UserType.PF) {
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    } else {
      return clean
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }
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
      setError('');
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
        } else {
          setError('CEP não encontrado. Verifique os números.');
        }
      } catch (err) {
        setError('Erro ao validar CEP. Verifique sua conexão.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidTaxId(formData.taxId, formData.userType)) {
      setError(`O ${formData.userType === UserType.PF ? 'CPF' : 'CNPJ'} inserido é inválido.`);
      return;
    }

    if (!formData.password) {
      setError("A senha é obrigatória.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    await register({
      name: formData.name,
      email: formData.email,
      [formData.userType === UserType.PF ? 'cpf' : 'cnpj']: formData.taxId,
      userType: formData.userType,
      zipCode: formData.zipCode,
      address: formData.address,
      addressNumber: formData.addressNumber,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state
    });
    
    navigate('/dashboard');
  };

  const inputStyle = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 transition-all shadow-sm";
  const labelStyle = "block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 border border-brand-100 animate-fadeIn relative">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-200">
             <i className="fas fa-user-plus text-brand-600 text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Criar Conta</h2>
          <p className="text-gray-500 mt-2 font-medium">Junte-se à comunidade Bora Alugar hoje mesmo.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl mb-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, userType: UserType.PF})}
                className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PF ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  Pessoa Física
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, userType: UserType.PJ})}
                className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PJ ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  Pessoa Jurídica
              </button>
          </div>

          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>Nome Completo / Razão Social</label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                  </div>
                  <div className="relative" ref={emailInputRef}>
                      <label className={labelStyle}>Email de Contato</label>
                      <input 
                        type="email" required
                        className={inputStyle}
                        value={formData.email} 
                        onChange={handleEmailChange}
                        autoComplete="off"
                      />
                      {showEmailSuggestions && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-2 animate-fadeIn max-h-48 overflow-y-auto">
                          {emailSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition"
                              onClick={() => selectEmailSuggestion(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>{formData.userType === UserType.PF ? 'CPF' : 'CNPJ'}</label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.taxId} onChange={e => setFormData({...formData, taxId: maskTaxId(e.target.value)})}
                      />
                  </div>
                  <div className="relative">
                      <label className={labelStyle + " flex justify-between items-center"}>
                        CEP
                        {isLoadingCep && <i className="fas fa-sync-alt fa-spin text-brand-500 text-[12px]"></i>}
                      </label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.zipCode} onChange={handleZipCodeChange}
                        placeholder="00000-000"
                      />
                  </div>
              </div>

              <div>
                  <label className={labelStyle}>Logradouro (Rua/Av)</label>
                  <input 
                    type="text" required
                    className={inputStyle}
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>Número</label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.addressNumber} onChange={e => setFormData({...formData, addressNumber: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className={labelStyle}>Complemento</label>
                      <input 
                        type="text"
                        className={inputStyle}
                        value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className={labelStyle}>Bairro</label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className={labelStyle}>Cidade</label>
                      <input 
                        type="text" required
                        className={inputStyle}
                        value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className={labelStyle}>UF</label>
                      <input 
                        type="text" required maxLength={2}
                        className={inputStyle + " uppercase"}
                        value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>Senha</label>
                      <input 
                        type="password" required
                        className={inputStyle}
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className={labelStyle}>Confirmar Senha</label>
                      <input 
                        type="password" required
                        className={inputStyle}
                        value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                  </div>
              </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-tight text-center animate-pulse"><i className="fas fa-exclamation-triangle mr-1"></i> {error}</p>}

          <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase tracking-widest mt-4">
            Cadastrar Gratuitamente
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm font-bold text-gray-400">
          Já tem conta? <Link to="/login" className="text-brand-600 hover:underline ml-1">Entrar</Link>
        </div>
      </div>
    </div>
  );
};
