
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
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
import { isSupabaseConfigured } from './lib/supabase';

// Tela de Erro Amigável para evitar tela branca ou erros de rede
const ConfigErrorScreen: React.FC<{ type?: 'config' | 'network' }> = ({ type = 'config' }) => (
  <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl animate-fadeIn border-t-8 border-brand-500">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-100 ${type === 'network' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
        <i className={`fas ${type === 'network' ? 'fa-wifi' : 'fa-plug'} text-3xl`}></i>
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-tight">
        {type === 'network' ? 'Erro de Conexão' : 'Quase lá!'}
      </h2>
      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
        {type === 'network' 
          ? 'Não conseguimos conectar ao banco de dados. Verifique se a URL do Supabase no arquivo lib/supabase.ts está correta e se o projeto está ativo.' 
          : 'O aplicativo detectou que as chaves do Supabase ainda não foram coladas ou estão incorretas no arquivo lib/supabase.ts.'}
      </p>
      <div className="bg-gray-50 p-6 rounded-2xl text-left border border-gray-100 space-y-3 mb-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolução de Problemas:</p>
        <div className="flex items-start gap-3">
            <span className="bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
            <p className="text-xs text-gray-600 font-bold">Confirme que a URL começa com <span className="text-brand-600">https://</span> e termina com <span className="text-brand-600">.supabase.co</span></p>
        </div>
        <div className="flex items-start gap-3">
            <span className="bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
            <p className="text-xs text-gray-600 font-bold">Certifique-se de que a chave ANON começa com <span className="text-brand-600">eyJ...</span></p>
        </div>
        <div className="flex items-start gap-3">
            <span className="bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
            <p className="text-xs text-gray-600 font-bold">Reinicie o servidor (<code className="bg-gray-200 px-1 rounded">npm run dev</code>) após salvar as alterações.</p>
        </div>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

// Componente Wrapper para detectar erros de rede no Contexto
const AppContent: React.FC = () => {
  const { networkError, isLoading } = useData();

  if (networkError) {
    return <ConfigErrorScreen type="network" />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
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
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-6 font-serif font-black text-[#1a2e21] text-2xl uppercase tracking-tighter">Bora Alugar</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 max-w-4xl mx-auto">
            <Link to="/ajuda" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Como podemos te ajudar?</Link>
            <Link to="/termos" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Termos e Condições</Link>
            <Link to="/privacidade" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] transition uppercase tracking-widest">Política de Privacidade</Link>
          </div>
          <div className="text-gray-500 text-sm space-y-1 border-t border-gray-50 pt-8">
            <p>&copy; {new Date().getFullYear()} Bora Alugar. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

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

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen type="config" />;
  }

  return (
    <HashRouter>
      <DataProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </DataProvider>
    </HashRouter>
  );
}

export default App;
