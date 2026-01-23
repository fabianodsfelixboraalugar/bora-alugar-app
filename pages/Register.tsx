
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';
import { BackButton } from '../components/BackButton';

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

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isValidTaxId } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailInputRef = useRef<HTMLDivElement>(null);
  const commonDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

  const passwordCriteria = useMemo(() => ({
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    if (value.includes('@')) {
      const [localPart, domainPart] = value.split('@');
      const filtered = commonDomains.filter(d => d.startsWith(domainPart.toLowerCase())).map(d => `${localPart}@${d}`);
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

  const maskTaxId = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (formData.userType === UserType.PF) {
      return clean.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    } else {
      return clean.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
    }
  };

  const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);

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
          setFormData(prev => ({ ...prev, address: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' }));
        } else {
          setError('CEP não encontrado.');
        }
      } catch (err) {
        setError('Erro ao validar CEP.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!acceptedTerms) { setError("Aceite os termos para continuar."); return; }
    if (!isValidTaxId(formData.taxId, formData.userType)) { setError("Documento inválido."); return; }
    if (!isPasswordValid) { setError("Sua senha precisa ser mais forte."); return; }
    if (formData.password !== formData.confirmPassword) { setError("As senhas não coincidem."); return; }

    setIsSubmitting(true);
    try {
      await register({ ...formData });
      // Se não houver erro, o Supabase enviará um e-mail de confirmação (se ativado)
      alert("Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de fazer login.");
      navigate('/login');
    } catch (err: any) {
      console.error("Erro no Registro:", err);
      // Tratamento específico para o erro 429 (Muitas tentativas)
      if (err.message?.includes('429') || err.status === 429) {
        setError("⚠️ LIMITE DE SEGURANÇA: Muitas tentativas de cadastro seguidas. O Supabase bloqueou seu IP por 1 minuto. Por favor, aguarde e tente novamente.");
      } else if (err.message?.includes('User already registered')) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setError(err.message || "Erro ao criar conta. Verifique sua conexão.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 transition-all";
  const labelStyle = "block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1";

  const CriterionItem = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${met ? 'text-green-500' : 'text-gray-300'}`}>
        <i className={`fas ${met ? 'fa-check-circle' : 'fa-circle'}`}></i>
        <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-6 w-full max-w-2xl">
        <BackButton label="Voltar" />
      </div>

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 border border-brand-100 animate-fadeIn relative">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-200">
             <i className="fas fa-user-plus text-brand-600 text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Criar Conta</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl mb-2">
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PF})} className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PF ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400'}`}>PF</button>
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PJ})} className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PJ ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400'}`}>PJ</button>
          </div>

          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>Nome Completo</label>
                      <input type="text" required className={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="relative" ref={emailInputRef}>
                      <label className={labelStyle}>Email</label>
                      <input type="email" required className={inputStyle} value={formData.email} onChange={handleEmailChange} autoComplete="off" />
                      {showEmailSuggestions && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl py-2">
                          {emailSuggestions.map((s, idx) => (
                            <button key={idx} type="button" className="w-full text-left px-4 py-2 text-xs hover:bg-brand-50" onClick={() => selectEmailSuggestion(s)}>{s}</button>
                          ))}
                        </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>{formData.userType === UserType.PF ? 'CPF' : 'CNPJ'}</label>
                      <input type="text" required className={inputStyle} value={formData.taxId} onChange={e => setFormData({...formData, taxId: maskTaxId(e.target.value)})} />
                  </div>
                  <div>
                      <label className={labelStyle}>CEP</label>
                      <div className="relative">
                        <input type="text" required className={inputStyle} value={formData.zipCode} onChange={handleZipCodeChange} placeholder="00000-000" />
                        {isLoadingCep && <i className="fas fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-brand-500"></i>}
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                      <label className={labelStyle}>Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} required className={inputStyle} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Senha forte" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                              <CriterionItem met={passwordCriteria.length} text="8+ Caract." />
                              <CriterionItem met={passwordCriteria.upper} text="Maiúsc." />
                              <CriterionItem met={passwordCriteria.lower} text="Minúsc." />
                              <CriterionItem met={passwordCriteria.number} text="Número" />
                          </div>
                      </div>
                  </div>
                  <div>
                      <label className={labelStyle}>Confirmar</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} required className={inputStyle} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex items-start gap-3 p-2">
            <input id="accept-terms-register" type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 text-brand-600 rounded cursor-pointer" />
            <label htmlFor="accept-terms-register" className="text-xs text-gray-500 cursor-pointer">Li e aceito os termos.</label>
          </div>

          {error && (
            <div className={`p-4 rounded-xl text-[10px] font-black uppercase text-center border animate-pulse ${error.includes('⚠️') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition uppercase tracking-widest mt-4 disabled:opacity-50"
          >
            {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'CADASTRAR AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
};
