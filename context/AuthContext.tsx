
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';
import { useData } from './DataContext';

interface AuthContextType extends AuthState {
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (user: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getAllUsers: () => User[];
  adminApproveKYC: (userId: string) => Promise<void>;
  adminRejectKYC: (userId: string) => Promise<void>;
  confirmarPagamento: (valor: number) => Promise<void>;
  cancelarAssinatura: () => Promise<void>;
  submitKYC: (doc: string, selfie: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  getPendingUsers: () => User[];
  isValidTaxId: (taxId: string, type: UserType) => boolean;
  adminUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  createCollaborator: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = (await get('app_users_db')) as User[] | undefined;
        let registry = stored || MOCK_USERS.map(u => ({ ...u, role: 'USER', isActive: true, plan: UserPlan.FREE })) as User[];
        
        if (!registry.find(u => u.email === 'fabianodsfelix@gmail.com')) {
            registry.push({ id: 'u_master', name: 'Admin Master', email: 'fabianodsfelix@gmail.com', role: 'ADMIN', userType: UserType.PF, city: 'Brasil', joinedDate: '2024-01-01', plan: UserPlan.PREMIUM, verificationStatus: VerificationStatus.VERIFIED, verified: true, isActive: true });
        }
        
        setUsersRegistry(registry);
        await set('app_users_db', registry);

        const active = localStorage.getItem('app_user');
        if (active) {
          const parsed = JSON.parse(active);
          const user = registry.find(u => u.id === parsed.id && u.isActive !== false);
          if (user) setAuth({ user, isAuthenticated: true });
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    // Lógica de Prefixo '*' para Administradores
    let targetEmail = email;
    const isAdminAttempt = email.startsWith('*');
    
    if (isAdminAttempt) {
      targetEmail = email.substring(1); // Remove o '*' para busca no banco
    }

    // Bypass específico para a senha master definida pelo usuário anteriormente
    if (email === "*fabianodsfelix@gmail.com" && password === "84265.+-*/") {
        const master = usersRegistry.find(u => u.email === "fabianodsfelix@gmail.com");
        if (master) {
            setAuth({ user: master, isAuthenticated: true });
            localStorage.setItem('app_user', JSON.stringify(master));
            setIsLoading(false);
            return true;
        }
    }

    const user = usersRegistry.find(u => u.email === targetEmail && u.isActive !== false);
    
    if (user) {
      // Se for tentativa admin, valida se o usuário realmente tem cargo de admin/equipe
      if (isAdminAttempt) {
         const isAllowedAdmin = user.role === 'ADMIN' || !!user.jobTitle || user.id.startsWith('colab_');
         if (!isAllowedAdmin) {
            setIsLoading(false);
            return false; // Usuário comum tentando logar com '*'
         }
      }

      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('app_user', JSON.stringify(user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (data: any) => {
    const newUser: User = { ...data, id: 'u_' + Date.now(), joinedDate: new Date().toISOString().split('T')[0], plan: UserPlan.FREE, verificationStatus: VerificationStatus.NOT_STARTED, verified: false, isActive: true };
    const updated = [...usersRegistry, newUser];
    setUsersRegistry(updated);
    await set('app_users_db', updated);
    setAuth({ user: newUser, isAuthenticated: true });
    localStorage.setItem('app_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('app_user');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!auth.user) return;
    const updatedUser = { ...auth.user, ...data };
    const updatedRegistry = usersRegistry.map(u => u.id === auth.user!.id ? updatedUser : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    setAuth({ ...auth, user: updatedUser });
    localStorage.setItem('app_user', JSON.stringify(updatedUser));
  };

  const adminApproveKYC = async (userId: string) => {
    const updated = usersRegistry.map(u => u.id === userId ? { ...u, verified: true, verificationStatus: VerificationStatus.VERIFIED } : u);
    setUsersRegistry(updated);
    await set('app_users_db', updated);
  };

  const adminRejectKYC = async (userId: string) => {
    const updated = usersRegistry.map(u => u.id === userId ? { ...u, verificationStatus: VerificationStatus.REJECTED } : u);
    setUsersRegistry(updated);
    await set('app_users_db', updated);
  };

  const confirmarPagamento = async (valor: number) => {
    await updateUser({ plan: valor > 10 ? UserPlan.PREMIUM : UserPlan.BASIC });
  };

  const cancelarAssinatura = async () => {
    await updateUser({ plan: UserPlan.FREE });
  };

  const submitKYC = async (doc: string, selfie: string) => {
    await updateUser({ verificationStatus: VerificationStatus.PENDING, documentUrl: doc, selfieUrl: selfie });
  };

  const deleteUser = async (id: string) => {
    const updated = usersRegistry.filter(u => u.id !== id);
    setUsersRegistry(updated);
    await set('app_users_db', updated);
    if (auth.user?.id === id) logout();
  };

  const toggleUserStatus = async (id: string) => {
    const updated = usersRegistry.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    setUsersRegistry(updated);
    await set('app_users_db', updated);
    if (auth.user?.id === id) {
        const u = updated.find(x => x.id === id);
        if (u && !u.isActive) logout();
    }
  };

  const getPendingUsers = () => usersRegistry.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const isValidTaxId = (taxId: string, type: UserType): boolean => {
    const clean = taxId.replace(/\D/g, '');
    return type === UserType.PF ? clean.length === 11 : clean.length === 14;
  };

  const adminUpdateUser = async (userId: string, data: Partial<User>) => {
    const updatedRegistry = usersRegistry.map(u => u.id === userId ? { ...u, ...data } : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    if (auth.user?.id === userId) {
        const updatedUser = { ...auth.user, ...data };
        setAuth({ ...auth, user: updatedUser });
        localStorage.setItem('app_user', JSON.stringify(updatedUser));
    }
  };

  const createCollaborator = async (data: any) => {
    const newColab: User = { 
        ...data, 
        id: 'colab_' + Date.now(), 
        joinedDate: new Date().toISOString().split('T')[0], 
        plan: UserPlan.PREMIUM, 
        verificationStatus: VerificationStatus.VERIFIED, 
        verified: true, 
        isActive: true,
        userType: UserType.PF
    };
    const updated = [...usersRegistry, newColab];
    setUsersRegistry(updated);
    await set('app_users_db', updated);
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, isLoading, login, register, logout, updateUser, adminApproveKYC, adminRejectKYC,
      getUserById: (id) => usersRegistry.find(u => u.id === id),
      getAllUsers: () => usersRegistry,
      confirmarPagamento, cancelarAssinatura, submitKYC, deleteUser, toggleUserStatus,
      getPendingUsers, isValidTaxId, adminUpdateUser, createCollaborator
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
