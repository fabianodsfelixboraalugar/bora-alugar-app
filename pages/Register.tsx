
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserType } from '../types';
import { BackButton } from '../components/BackButton';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', taxId: '', userType: UserType.PF, zipCode: '', address: '',
    addressNumber: '', complement: '', neighborhood: '', city: '', state: '',
    password: '', confirmPassword: ''
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryTimer, setRetryTimer] = useState(0);
  
  const { register, isValidTaxId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (retryTimer > 0) interval = setInterval(() => setRetryTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [retryTimer]);

  const passwordCriteria = useMemo(() => ({
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }), [formData.password]);

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
      showToast("Conta criada! Verifique seu e-mail.", 'success');
      navigate('/login');
    } catch (err: any) {
      if (err.message?.includes('429')) {
        showToast("Muitas tentativas. Aguarde 60 segundos.", 'error');
        setRetryTimer(60);
      } else {
        showToast(err.message || "Erro ao criar conta.", 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 transition-all text-sm font-medium";
  const labelStyle = "block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-6 w-full max-w-2xl">
        <BackButton label="Voltar" />
      </div>

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 border border-brand-100 animate-fadeIn">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Criar Conta</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PF})} className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PF ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400'}`}>PF</button>
              <button type="button" onClick={() => setFormData({...formData, userType: UserType.PJ})} className={`py-3 rounded-xl font-bold transition ${formData.userType === UserType.PJ ? 'bg-brand-500 text-white shadow-md' : 'text-gray-400'}`}>PJ</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className={labelStyle}>Nome Completo</label>
                  <input name="fullname" type="text" required className={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                  <label className={labelStyle}>Email</label>
                  <input name="email" type="email" required className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className={labelStyle}>{formData.userType === UserType.PF ? 'CPF' : 'CNPJ'}</label>
                  <input name="taxid" type="text" required className={inputStyle} value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
              </div>
              <div>
                  <label className={labelStyle}>Senha</label>
                  <input name="new-password" type="password" required className={inputStyle} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className={labelStyle}>Confirmar Senha</label>
                  <input name="confirm-password" type="password" required className={inputStyle} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input id="accept-terms" type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="w-5 h-5 text-brand-600 rounded" />
                <label htmlFor="accept-terms" className="text-[10px] text-gray-500 font-bold uppercase cursor-pointer">Aceito os Termos</label>
              </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || retryTimer > 0}
            className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition uppercase tracking-widest mt-4 ${retryTimer > 0 ? 'bg-gray-400' : 'bg-brand-500 hover:bg-brand-600'}`}
          >
            {retryTimer > 0 ? `AGUARDE ${retryTimer}s` : (isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'CADASTRAR AGORA')}
          </button>
        </form>
      </div>
    </div>
  );
};
