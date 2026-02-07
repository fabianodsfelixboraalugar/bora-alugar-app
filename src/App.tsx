
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { InstallPwaNotification } from './components/InstallPwaNotification';

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
      <AuthProvider>
        <DataProvider>
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
            <footer className="bg-white border-t border-gray-200 mt-12 py-12">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                <p className="mb-2 font-serif font-black text-[#1a2e21] text-2xl uppercase tracking-tighter">Bora Alugar</p>
                <p>&copy; {new Date().getFullYear()} Bora Alugar. Todos os direitos reservados.</p>
                <p className="mt-2 text-xs text-gray-400">Plataforma de Economia Compartilhada</p>
              </div>
            </footer>
          </div>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
