
import React from 'react';
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

// Componente de Proteção para o Painel Master
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se o usuário é ADMIN ou um Colaborador Ativo com cargo definido
  const isAuthorized = user.isActive !== false && (
    user.role === 'ADMIN' || 
    (user.jobTitle && user.jobTitle.trim().length > 0) || 
    user.id.startsWith('colab_')
  );

  if (!isAuthorized) {
    // Se for um usuário comum tentando acessar, manda de volta para a Home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <HashRouter>
      <DataProvider>
        <AuthProvider>
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
                
                {/* Páginas Institucionais */}
                <Route path="/ajuda" element={<Help />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/termos-anunciante" element={<AdvertiserTerms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                
                {/* Rotas Protegidas para Usuários Logados */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-item" element={<AddItem />} />
                <Route path="/chat" element={<Chat />} />
                
                {/* Rota Altamente Protegida - Apenas Admin/Colaboradores */}
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
