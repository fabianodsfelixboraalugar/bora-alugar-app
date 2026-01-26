
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [retryTimer, setRetryTimer] = useState(0);
  
  const { register, isValidTaxId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (retryTimer > 0) {
      interval = setInterval(() => {
        setRetryTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [retryTimer]);

  const passwordCriteria = useMemo(() => ({
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }), [formData.password]);

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
          showToast("CEP localizado com sucesso!", "success");
        } else {
          showToast("CEP não encontrado.", "warning");
        }
      } catch (err) {
        showToast("Erro ao validar CEP.", "error");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryTimer > 0) return;
    
    if (!acceptedTerms) { showToast("Aceite os termos para continuar.", 'warning'); return; }
    if (!isValidTaxId(formData.taxId, formData.userType)) { showToast("Documento (CPF/CNPJ) inválido.", 'error'); return; }
    if (!Object.values(passwordCriteria).every(Boolean)) { showToast("Sua senha precisa ser mais forte.", 'warning'); return; }
    if (formData.password !== formData.confirmPassword) { showToast("As senhas não coincidem.", 'error'); return; }

    setIsSubmitting(true);
    try {
      await register({ ...formData });
      showToast("Conta criada! Verifique seu e-mail de ativação.", 'success');
      navigate('/login');
    } catch (err: any) {
      console.error("Erro no registro:", err);
      if (err.message?.includes('429')) {
        showToast("Muitas tentativas. Aguarde 60 segundos.", 'error');
        setRetryTimer(60);
      } else if (err.message?.includes('422')) {
        showToast("Erro de validação. Verifique se o e-mail já existe.", 'error');
      } else {
        showToast(err.message || "Erro inesperado ao criar conta.", 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 transition-all text-sm font-medium";
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

      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-xl p-10 border border-brand-100 animate-fadeIn">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Criar Conta</h2>
          <p className="text-gray-400 text-xs font-bold uppercase mt-2 tracking-widest">Junte-se ao Bora Alugar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6" id="register-form">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PF})} className={`py-3 rounded-xl font-black text-xs uppercase transition ${formData.userType === UserType.PF ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Pessoa Física</button>
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PJ})} className={`py-3 rounded-xl font-black text-xs uppercase transition ${formData.userType === UserType.PJ ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Pessoa Jurídica</button>
          </div>

          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>Nome Completo</label>
                      <input name="fullname" type="text" required className={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                      <label className={labelStyle}>E-mail</label>
                      <input name="email" type="email" required className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className={labelStyle}>{formData.userType === UserType.PF ? 'CPF' : 'CNPJ'}</label>
                      <input name="taxid" type="text" required className={inputStyle} value={formData.taxId} onChange={e => setFormData({...formData, taxId: maskTaxId(e.target.value)})} />
                  </div>
                  <div>
                      <label className={labelStyle}>CEP</label>
                      <div className="relative">
                        <input name="zipcode" type="text" required className={inputStyle} value={formData.zipCode} onChange={handleZipCodeChange} placeholder="00000-000" />
                        {isLoadingCep && <i className="fas fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-brand-500"></i>}
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                      <label className={labelStyle}>Logradouro (Rua/Av)</label>
                      <input name="address" type="text" required className={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                      <label className={labelStyle}>Nº</label>
                      <input name="number" type="text" required className={inputStyle} value={formData.addressNumber} onChange={e => setFormData({...formData, addressNumber: e.target.value})} />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className={labelStyle}>Bairro</label>
                      <input name="neighborhood" type="text" required className={inputStyle} value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  </div>
                  <div>
                      <label className={labelStyle}>Cidade</label>
                      <input name="city" type="text" required className={inputStyle} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div>
                      <label className={labelStyle}>UF</label>
                      <input name="state" type="text" required maxLength={2} className={inputStyle + " uppercase text-center"} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                      <label className={labelStyle}>Escolha uma Senha</label>
                      <div className="relative">
                        <input 
                          name="new-password" 
                          type={showPassword ? "text" : "password"} 
                          required 
                          className={inputStyle} 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition-colors">
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl grid grid-cols-2 gap-y-2 border border-gray-100">
                          <CriterionItem met={passwordCriteria.length} text="8+ Caract." />
                          <CriterionItem met={passwordCriteria.upper} text="Maiúscula" />
                          <CriterionItem met={passwordCriteria.lower} text="Minúscula" />
                          <CriterionItem met={passwordCriteria.number} text="Número" />
                          <div className="col-span-2">
                            <CriterionItem met={passwordCriteria.special} text="Símbolo (!@#$)" />
                          </div>
                      </div>
                  </div>
                  <div>
                      <label className={labelStyle}>Confirme sua Senha</label>
                      <input name="confirm-password" type="password" required className={inputStyle} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                  </div>
              </div>
          </div>

          <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100">
            <input id="accept-terms-reg" type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 text-brand-600 rounded cursor-pointer" />
            <label htmlFor="accept-terms-reg" className="text-[10px] text-gray-400 font-black uppercase leading-relaxed cursor-pointer select-none">
              Li e concordo com os Termos e Políticas de Privacidade.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || retryTimer > 0}
            className={`w-full text-white font-black py-5 rounded-[2rem] shadow-xl transition transform active:scale-[0.98] uppercase tracking-[0.1em] text-sm ${retryTimer > 0 ? 'bg-gray-400 cursor-wait' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-100'}`}
          >
            {retryTimer > 0 ? `Aguarde ${retryTimer}s` : (isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Finalizar Cadastro')}
          </button>
          
          <div className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Já tem uma conta? <Link to="/login" className="text-brand-500 hover:underline">Fazer Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
