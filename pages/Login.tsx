
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [customError, setCustomError] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const { login, getAllUsers } = useAuth();
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
    
    const handleClickOutside = (event: MouseEvent) => {
      if (emailInputRef.current && !emailInputRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (loginError) setLoginError(false);
    if (customError) setCustomError('');

    if (value.includes('@') && !value.startsWith('*')) {
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
    setEmail(suggestion);
    setShowEmailSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    setCustomError('');

    if (!acceptedTerms) {
      setCustomError("Você deve aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    const success = await login(email, password);
    if (success) {
      if (rememberMe) {
        localStorage.setItem('saved_email', email);
      } else {
        localStorage.removeItem('saved_email');
      }
      navigate('/dashboard');
    } else {
      setLoginError(true);
    }
  };

  const handleRecoverPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRecoveryStatus('loading');
    
    try {
      const allUsers = await getAllUsers();
      const userExists = allUsers.find(u => u.email === (recoveryEmail || email));

      setTimeout(() => {
        if (userExists) {
          setRecoveryStatus('success');
        } else {
          setRecoveryStatus('error');
        }
      }, 1500);
    } catch (err) {
      setRecoveryStatus('error');
    }
  };

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecoveryStatus('idle');
    setShowRecoveryModal(true);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-6 w-full max-w-md">
        <BackButton label="VOLTAR" />
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-8 flex flex-col relative">
            <button onClick={() => setShowRecoveryModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2">
              <i className="fas fa-times text-xl"></i>
            </button>

            {recoveryStatus === 'success' ? (
              <div className="text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                  <i className="fas fa-check text-green-500 text-3xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">E-mail Enviado!</h3>
                  <p className="text-sm text-gray-500 font-medium">Instruções de recuperação foram enviadas para <span className="text-brand-600 font-bold">{recoveryEmail || email}</span>.</p>
                </div>
                <button onClick={() => setShowRecoveryModal(false)} className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest">Voltar</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                    <i className="fas fa-key text-brand-600 text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recuperar Senha</h3>
                </div>
                <form onSubmit={(e) => handleRecoverPassword(e)} className="space-y-4">
                  <input 
                    type="email" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={recoveryEmail}
                    onChange={e => { setRecoveryEmail(e.target.value); setRecoveryStatus('idle'); }}
                    placeholder="seu@email.com"
                  />
                  <button type="submit" disabled={recoveryStatus === 'loading'} className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest">
                    {recoveryStatus === 'loading' ? 'Enviando...' : 'Enviar Link'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn">
        <div className="p-8 md:p-10 flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-700 uppercase tracking-tighter">ENTRAR</h2>
            <p className="text-gray-400 mt-2 font-medium text-sm">Acesse sua conta para alugar e anunciar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative" ref={emailInputRef}>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">EMAIL</label>
              <input 
                type="text" required autoComplete="off"
                className={`w-full px-5 py-4 rounded-2xl border ${loginError ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50/30'} focus:ring-2 focus:ring-brand-500 outline-none transition font-medium text-gray-700`}
                value={email} onChange={handleEmailChange}
                placeholder="seu@email.com"
              />
              {showEmailSuggestions && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 max-h-48 overflow-y-auto">
                  {emailSuggestions.map((suggestion, idx) => (
                    <button key={idx} type="button" className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-brand-50 transition" onClick={() => selectEmailSuggestion(suggestion)}>{suggestion}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">SENHA</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required
                  className={`w-full px-5 py-4 rounded-2xl border ${loginError ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50/30'} focus:ring-2 focus:ring-brand-500 outline-none transition pr-12 font-medium text-gray-700`}
                  value={password} onChange={e => { setPassword(e.target.value); if (loginError) setLoginError(false); }}
                  placeholder="••••••••"
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
              <button type="button" onClick={openRecovery} className="text-[10px] font-black text-brand-300 hover:text-brand-600 uppercase transition-colors">ESQUECI A SENHA</button>
            </div>

            <div className="flex items-start gap-3 px-1 pt-2">
              <input id="accept-terms-login" type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 text-brand-600 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="accept-terms-login" className="text-[10px] text-gray-400 font-bold leading-relaxed cursor-pointer">
                Li e concordo com os <Link to="/termos" className="text-brand-500 underline">Termos</Link> e <Link to="/privacidade" className="text-brand-500 underline">Privacidade</Link>.
              </label>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-fadeIn text-[10px] text-red-600 font-black uppercase text-center">
                Credenciais Incorretas. Tente novamente.
              </div>
            )}

            <button type="submit" className="w-full bg-[#84cc16] hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-lg transition transform active:scale-95 uppercase tracking-widest text-sm">
              ENTRAR NO BORA ALUGAR
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
