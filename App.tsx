import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
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

const ConfigErrorScreen: React.FC<{ type?: 'config' | 'network' }> = ({ type = 'config' }) => (
  <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl animate-fadeIn border-t-8 border-brand-500">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-100 ${type === 'network' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
        <i className={`fas ${type === 'network' ? 'fa-wifi' : 'fa-plug'} text-3xl`}></i>
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-tight">
        {type === 'network' ? 'Erro de Conexão' : 'Configuração Necessária'}
      </h2>
      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
        {type === 'network' 
          ? 'Não conseguimos conectar ao servidor. Verifique sua internet.' 
          : 'As chaves do Supabase não foram configuradas corretamente em lib/supabase.ts.'}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando...</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const { networkError } = useData();

  if (networkError) {
    return <ConfigErrorScreen type="network" />;
  }

  if (isAuthLoading) {
    return <LoadingScreen />;
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
          </div>
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Bora Alugar. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const isAuthorized = user.role === 'ADMIN' || !!user.jobTitle;
  if (!isAuthorized) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  if (!isSupabaseConfigured) return <ConfigErrorScreen type="config" />;

  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;