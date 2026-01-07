
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { ItemDetails } from './pages/ItemDetails';
import { AddItem } from './pages/AddItem';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Chat } from './pages/Chat';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserProfile } from './pages/UserProfile';
import { Help } from './pages/Help';
import { Terms } from './pages/Terms';
import { AdvertiserTerms } from './pages/AdvertiserTerms';
import { Privacy } from './pages/Privacy';
import { CookiePolicy } from './pages/CookiePolicy';
import { InstallPwaNotification } from './components/InstallPwaNotification';
import { CookieConsent } from './components/CookieConsent';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Tela de Erro Amigável para evitar tela branca
const ConfigErrorScreen: React.FC = () => (
  <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl animate-fadeIn border-t-8 border-brand-500">
      <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600 border border-brand-100">
        <i className="fas fa-plug text-3xl"></i>
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-tight">Conexão Necessária</h2>
      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
        Para o aplicativo funcionar, você precisa colar a <span className="font-black text-gray-800">Project URL</span> e a <span className="font-black text-gray-800">Anon Key</span> no arquivo <code className="bg-gray-100 px-1 rounded">lib/supabase.ts</code>.
      </p>
      <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100 space-y-2 mb-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Onde encontrar:</p>
        <p className="text-xs text-gray-600 font-bold">• Supabase &gt;  Project Settings &gt;  API</p>
        <p className="text-xs text-gray-600 font-bold">• Copie a "Project URL" (https://...)</p>
        <p className="text-xs text-gray-600 font-bold">• Copie a "anon" key (eyJh...)</p>
      </div>
      <p className="text-[10px] text-gray-400 font-black uppercase italic">O app voltará a funcionar assim que você salvar o arquivo.</p>
    </div>
  </div>
);

// Componente de Proteção para o Painel Master
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = user.isActive !== false && (
    user.role === 'ADMIN' || 
    (user.jobTitle && user.jobTitle.trim().length > 0) || 
    user.id.startsWith('colab_')
  );

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Componente de Verificação de Conexão (Barra de Status)
const ConnectionChecker: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('offline');
      return;
    }

    async function checkSupabase() {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        setStatus('online');
      } catch (err) {
        setStatus('offline');
      }
    }
    checkSupabase();
  }, []);

  if (status === 'offline') {
    return (
      <div className="bg-red-600 text-white text-[10px] font-black py-1 px-4 text-center uppercase tracking-widest sticky top-0 z-[200]">
        <i className="fas fa-exclamation-triangle mr-2"></i> 
        Erro de Conexão. Verifique as chaves em lib/supabase.ts
      </div>
    );
  }
  return null;
};

function App() {
  // Se não estiver configurado, mostra a tela de erro em vez do app
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <HashRouter>
      <DataProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen font-sans text-gray-800">
            <ConnectionChecker />
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/item/:id" element={<ItemDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                
                <Route path="/ajuda" element={<Help />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/termos-anunciante" element={<AdvertiserTerms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-item" element={<AddItem />} />
                <Route path="/chat" element={<Chat />} />
                
                <Route 
                  path="/admin-master" 
                  element={
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  } 
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <InstallPwaNotification />
            <CookieConsent />
            <footer className="bg-white border-t border-gray-200 mt-12 py-12">
              <div className="max-w-7xl auto px-4 text-center">
                <p className="mb-6 font-serif font-black text-[#1a2e21] text-2xl uppercase tracking-tighter">Bora Alugar</p>
                
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 max-w-4xl mx-auto">
                  <Link to="/ajuda" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Como podemos te ajudar?</Link>
                  <Link to="/termos" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Termos e Condições</Link>
                  <Link to="/termos-anunciante" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Termos de Anunciantes</Link>
                  <Link to="/privacidade" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Política de Privacidade</Link>
                  <Link to="/cookies" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Política de Cookies</Link>
                </div>

                <div className="text-gray-400 text-[10px] font-black uppercase tracking-tight max-w-lg mx-auto mb-10 leading-relaxed italic">
                  A Bora Alugar atua como intermediadora e não se responsabiliza por negociações entre usuários.
                </div>

                <div className="text-gray-500 text-sm space-y-1 border-t border-gray-50 pt-8">
                  <p>&copy; {new Date().getFullYear()} Bora Alugar. Todos os direitos reservados.</p>
                  <p className="text-xs text-gray-400">Plataforma de Economia Compartilhada</p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </DataProvider>
    </HashRouter>
  );
}

export default App;
