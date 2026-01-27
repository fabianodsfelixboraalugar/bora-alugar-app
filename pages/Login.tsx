import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackButton } from '../components/BackButton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast("Bem-vindo de volta!", 'success');
        navigate('/dashboard');
      } else {
        showToast(result.message || "Erro ao entrar. Verifique seus dados.", 'error');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      showToast("Falha na conexão. Tente novamente.", "error");
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">EMAIL</label>
              <input 
                type="email" required
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:ring-2 focus:ring-brand-500 outline-none transition font-medium text-gray-700 shadow-sm"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">SENHA</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:ring-2 focus:ring-brand-500 outline-none transition pr-12 font-medium text-gray-700 shadow-sm"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-500 transition-colors">
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
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