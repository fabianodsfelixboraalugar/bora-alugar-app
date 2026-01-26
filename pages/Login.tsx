
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackButton } from '../components/BackButton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailInputRef = useRef<HTMLDivElement>(null);
  const commonDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value.includes('@')) {
      const [localPart, domainPart] = value.split('@');
      const filtered = commonDomains.filter(d => d.startsWith(domainPart.toLowerCase())).map(d => `${localPart}@${d}`);
      setEmailSuggestions(filtered);
      setShowEmailSuggestions(filtered.length > 0);
    } else {
      setShowEmailSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!acceptedTerms) {
      showToast("Você deve aceitar os termos de uso para continuar.", 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) localStorage.setItem('saved_email', email);
        else localStorage.removeItem('saved_email');
        showToast("Bem-vindo de volta!", 'success');
        navigate('/dashboard');
      } else {
        showToast(result.message || "E-mail ou senha incorretos.", 'error');
      }
    } catch (err: any) {
      showToast("Ocorreu um erro ao tentar entrar. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-6 w-full max-w-md">
        <BackButton label="VOLTAR" />
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn">
        <div className="p-8 md:p-10 flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tighter">ENTRAR</h2>
            <p className="text-gray-400 mt-2 font-medium text-sm">Acesse sua conta para alugar e anunciar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" id="login-form">
            <div className="relative" ref={emailInputRef}>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">EMAIL</label>
              <input 
                name="email" type="email" required autoComplete="username"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:ring-2 focus:ring-brand-500 outline-none transition font-medium text-gray-700 shadow-sm"
                value={email} onChange={handleEmailChange} placeholder="seu@email.com"
              />
              {showEmailSuggestions && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl py-2">
                  {emailSuggestions.map((s, idx) => (
                    <button key={idx} type="button" className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-brand-50" onClick={() => { setEmail(s); setShowEmailSuggestions(false); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">SENHA</label>
              <div className="relative">
                <input 
                  name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:ring-2 focus:ring-brand-500 outline-none transition pr-12 font-medium text-gray-700 shadow-sm"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-500 transition-colors">
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-brand-600 rounded cursor-pointer" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="remember-me" className="ml-2 block text-[10px] font-black text-gray-400 cursor-pointer uppercase">LEMBRAR EMAIL</label>
              </div>
            </div>

            <div className="flex items-start gap-3 px-1">
              <input id="accept-terms-login" type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 text-brand-600 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="accept-terms-login" className="text-[10px] text-gray-400 font-bold leading-relaxed cursor-pointer select-none">
                Li e concordo com os Termos e Privacidade.
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-lg transition transform active:scale-95 uppercase tracking-widest text-sm disabled:opacity-50">
              {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'ENTRAR NO BORA ALUGAR'}
            </button>
          </form>
          
          <div className="mt-10 text-center text-[11px] font-black text-gray-300 uppercase tracking-tighter">
            Não tem uma conta? <Link to="/register" className="text-brand-500 hover:underline ml-1">Cadastre-se grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
