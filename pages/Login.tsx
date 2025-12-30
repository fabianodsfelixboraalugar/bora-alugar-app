
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

  // Email Suggestions State
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailInputRef = useRef<HTMLDivElement>(null);
  const commonDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

  // --- FUNCIONALIDADE DE TESTE RÁPIDO ---
  const fillTestUser = (role: 'ALUGADOR' | 'LOCATARIO' | 'MASTER') => {
    setLoginError(false);
    setCustomError('');
    if (role === 'ALUGADOR') {
      setEmail('joao.alugador@teste.com');
      setPassword('123');
    } else if (role === 'LOCATARIO') {
      setEmail('maria.locataria@teste.com');
      setPassword('123');
    } else if (role === 'MASTER') {
      setEmail('*fabianodsfelix@gmail.com');
      setPassword('84265.+-*/');
    }
    setAcceptedTerms(true);
  };

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

  const handleRecoverPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRecoveryStatus('loading');
    
    // Simulação de busca no banco de dados
    const allUsers = getAllUsers();
    const userExists = allUsers.find(u => u.email === (recoveryEmail || email));

    setTimeout(() => {
      if (userExists) {
        setRecoveryStatus('success');
      } else {
        setRecoveryStatus('error');
      }
    }, 1500);
  };

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecoveryStatus('idle');
    setShowRecoveryModal(true);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-6 w-full max-w-md">
        <BackButton label="Voltar" />
      </div>

      {/* Modal de Recuperação de Senha */}
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
                  <p className="text-sm text-gray-500 font-medium">Instruções de recuperação foram enviadas para <span className="text-brand-600 font-bold">{recoveryEmail || email}</span>. Verifique sua caixa de entrada e spam.</p>
                </div>
                <button 
                  onClick={() => setShowRecoveryModal(false)}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase text-xs tracking-widest"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                    <i className="fas fa-key text-brand-600 text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recuperar Senha</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Informe seu e-mail cadastrado para receber um link de redefinição.</p>
                </div>

                <form onSubmit={handleRecoverPassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Seu E-mail</label>
                    <input 
                      type="email" 
                      required
                      className={`w-full px-4 py-3 rounded-xl border ${recoveryStatus === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:ring-2 focus:ring-brand-500 outline-none transition shadow-sm text-sm`}
                      value={recoveryEmail}
                      onChange={e => { setRecoveryEmail(e.target.value); setRecoveryStatus('idle'); }}
                      placeholder="seu@email.com"
                    />
                    {recoveryStatus === 'error' && (
                      <p className="text-[10px] text-red-600 font-bold mt-2 ml-1 uppercase"><i className="fas fa-times-circle mr-1"></i> E-mail não encontrado em nossa base.</p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={recoveryStatus === 'loading'}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                    {recoveryStatus === 'loading' ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i> Processando...
                      </>
                    ) : (
                      'Enviar Link de Recuperação'
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full bg-white text-gray-400 font-bold py-3 text-xs uppercase tracking-widest hover:text-gray-600 transition"
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fadeIn relative">
        
        {/* BOTÕES DE TESTE RÁPIDO */}
        <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-20">
          <button 
            type="button"
            onClick={() => fillTestUser('ALUGADOR')}
            className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-brand-200 shadow-sm transition"
          >
            Alugador
          </button>
          <button 
            type="button"
            onClick={() => fillTestUser('LOCATARIO')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-200 shadow-sm transition"
          >
            Locatário
          </button>
          <button 
            type="button"
            onClick={() => fillTestUser('MASTER')}
            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-brand-200 shadow-sm transition"
          >
            <i className="fas fa-crown mr-1"></i> Admin Master
          </button>
        </div>

        <div className="text-center mb-8 mt-6">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Entrar</h2>
          <p className="text-gray-500 mt-2 font-medium">Acesse sua conta para alugar e anunciar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative" ref={emailInputRef}>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
            <input 
              type="text" 
              required
              autoComplete="off"
              className={`w-full px-4 py-3 rounded-xl border ${loginError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition shadow-sm`}
              value={email}
              onChange={handleEmailChange}
              placeholder="seu@email.com"
            />
            {showEmailSuggestions && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 animate-fadeIn max-h-48 overflow-y-auto">
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
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className={`w-full px-4 py-3 rounded-xl border ${loginError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition shadow-sm pr-12`}
                value={password}
                onChange={e => { setPassword(e.target.value); if (loginError) setLoginError(false); if (customError) setCustomError(''); }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-600 cursor-pointer select-none uppercase tracking-tighter">
                Lembrar meu email
              </label>
            </div>
            <button 
              type="button"
              onClick={openRecovery}
              className="text-xs font-bold text-brand-600 hover:underline uppercase tracking-tighter"
            >
              Esqueci a senha
            </button>
          </div>

          <div className="flex items-start gap-3 px-1">
            <input 
              id="accept-terms-login"
              type="checkbox" 
              checked={acceptedTerms} 
              onChange={e => { setAcceptedTerms(e.target.checked); if (customError) setCustomError(''); }}
              className="mt-1 w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="accept-terms-login" className="text-xs text-gray-500 font-medium leading-relaxed cursor-pointer select-none">
              Li e concordo com os <Link to="/termos" className="text-brand-600 hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" className="text-brand-600 hover:underline">Política de Privacidade</Link>.
            </label>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-fadeIn space-y-2">
              <p className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-xs"></i> Credenciais Incorretas
              </p>
              <button 
                type="button" 
                onClick={openRecovery}
                className="w-full py-2 bg-white border border-red-200 rounded-xl text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition shadow-sm"
              >
                Recuperar Senha
              </button>
            </div>
          )}

          {customError && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl animate-fadeIn">
              <p className="text-red-600 text-[9px] font-black uppercase tracking-tight text-center">
                <i className="fas fa-exclamation-triangle mr-1"></i> {customError}
              </p>
            </div>
          )}

          <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase tracking-widest">
            Entrar no Bora Alugar
          </button>
        </form>
        <div className="mt-8 text-center text-sm font-bold text-gray-400">
          Não tem uma conta? <Link to="/register" className="text-brand-600 hover:underline ml-1">Cadastre-se grátis</Link>
        </div>
      </div>
    </div>
  );
};
