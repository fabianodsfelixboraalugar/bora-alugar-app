import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { supabase } from './lib/supabase';

import { Navbar } from './components/Navbar';
import { InstallPwaNotification } from './components/InstallPwaNotification';
import { CookieConsent } from './components/CookieConsent';

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

/* =======================
   ADMIN GUARD
======================= */
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized =
    user.isActive !== false &&
    (user.role === 'ADMIN' ||
      (user.jobTitle && user.jobTitle.trim().length > 0) ||
      user.id.startsWith('colab_'));

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/* =======================
   CONNECTION CHECKER
======================= */
const ConnectionChecker: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  useEffect(() => {
    async function check() {
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) throw error;
        setStatus('online');
      } catch {
        setStatus('offline');
      }
    }

    check();
  }, []);

  if (status === 'offline') {
    return (
      <div className="bg-red-600 text-white text-[10px] font-black py-1 px-4 text-center uppercase tracking-widest sticky top-0 z-[200]">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        Erro de conexão com o servidor
      </div>
    );
  }

  return null;
};

/* =======================
   APP
======================= */
function App() {
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
                <Route
                  path="/termos-anunciante"
                  element={<AdvertiserTerms />}
                />
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
                <p className="mb-6 font-serif font-black text-[#1a2e21] text-2xl uppercase tracking-tighter">
                  Bora Alugar
                </p>

                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 max-w-4xl mx-auto">
                  <Link to="/ajuda" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] uppercase tracking-widest">
                    Como podemos te ajudar?
                  </Link>
                  <Link to="/termos" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] uppercase tracking-widest">
                    Termos e Condições
                  </Link>
                  <Link to="/termos-anunciante" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] uppercase tracking-widest">
                    Termos de Anunciantes
                  </Link>
                  <Link to="/privacidade" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] uppercase tracking-widest">
                    Política de Privacidade
                  </Link>
                  <Link to="/cookies" className="text-gray-500 hover:text-brand-600 font-bold text-[11px] uppercase tracking-widest">
                    Política de Cookies
                  </Link>
                </div>

                <div className="text-gray-400 text-[10px] font-black uppercase tracking-tight max-w-lg mx-auto mb-10 italic">
                  A Bora Alugar atua como intermediadora e não se responsabiliza por negociações entre usuários.
                </div>

                <div className="text-gray-500 text-sm space-y-1 border-t border-gray-50 pt-8">
                  <p>
                    &copy; {new Date().getFullYear()} Bora Alugar. Todos os direitos
                    reservados.
                  </p>
                  <p className="text-xs text-gray-400">
                    Plataforma de Economia Compartilhada
                  </p>
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
