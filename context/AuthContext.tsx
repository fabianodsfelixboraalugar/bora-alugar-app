
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { supabase, IS_PREVIEW } from '../lib/supabase';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  register: (user: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  adminUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getPendingUsers: () => User[];
  getAllUsers: () => User[];
  adminApproveKYC: (userId: string) => Promise<void>;
  adminRejectKYC: (userId: string) => Promise<void>;
  submitKYC: (doc: string, selfie: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  createCollaborator: (data: any) => Promise<void>;
  isValidTaxId: (id: string, type: UserType) => boolean;
  confirmarPagamento: (v: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);

  useEffect(() => {
    const init = async () => {
      if (IS_PREVIEW) {
        const stored = await get<User[]>('app_users_db');
        let registry = stored || MOCK_USERS.map(u => ({ ...u, role: 'USER' as UserRole, isActive: true }));
        
        // Garantir admin master
        if (!registry.find(u => u.email === 'fabianodsfelix@gmail.com')) {
          registry.push({
            id: 'u_master',
            name: 'Fabiano Master',
            email: 'fabianodsfelix@gmail.com',
            role: 'ADMIN',
            userType: UserType.PF,
            city: 'São Paulo',
            joinedDate: '2024-01-01',
            plan: UserPlan.PREMIUM,
            verificationStatus: VerificationStatus.VERIFIED,
            isActive: true
          });
        }
        
        setUsersRegistry(registry);
        await set('app_users_db', registry);

        const active = localStorage.getItem('app_user');
        if (active) {
          const parsed = JSON.parse(active);
          const found = registry.find(u => u.id === parsed.id);
          if (found && found.isActive) setAuth({ user: found, isAuthenticated: true });
        }
      } else {
        // Lógica Supabase Real
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setAuth({ user: profile, isAuthenticated: true });
        }
      }
    };
    init();
  }, []);

  const login = async (email: string, password?: string) => {
    if (IS_PREVIEW) {
      if (email.startsWith('*') && password === "84265.+-*/") {
        const master = usersRegistry.find(u => u.email === 'fabianodsfelix@gmail.com');
        if (master) {
          setAuth({ user: master, isAuthenticated: true });
          localStorage.setItem('app_user', JSON.stringify(master));
          return true;
        }
      }
      const user = usersRegistry.find(u => u.email === email && u.isActive !== false);
      if (user) {
        setAuth({ user, isAuthenticated: true });
        localStorage.setItem('app_user', JSON.stringify(user));
        return true;
      }
      return false;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
    return !error;
  };

  const register = async (userData: any) => {
    if (IS_PREVIEW) {
      const newUser: User = {
        ...userData,
        id: 'u_' + Date.now(),
        role: 'USER',
        joinedDate: new Date().toISOString().split('T')[0],
        plan: UserPlan.FREE,
        verificationStatus: VerificationStatus.NOT_STARTED,
        isActive: true,
        trustStats: { score: 50, level: 'NEUTRAL', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 0, countRatingAsOwner: 0, avgRatingAsRenter: 0, countRatingAsRenter: 0 }
      };
      const updated = [...usersRegistry, newUser];
      setUsersRegistry(updated);
      await set('app_users_db', updated);
      setAuth({ user: newUser, isAuthenticated: true });
      localStorage.setItem('app_user', JSON.stringify(newUser));
      return;
    }
    await supabase.auth.signUp({ email: userData.email, password: userData.password });
  };

  const logout = () => {
    if (IS_PREVIEW) {
      setAuth({ user: null, isAuthenticated: false });
      localStorage.removeItem('app_user');
    } else {
      supabase.auth.signOut();
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!auth.user) return;
    const updated = { ...auth.user, ...data };
    setAuth({ ...auth, user: updated });
    if (IS_PREVIEW) {
      localStorage.setItem('app_user', JSON.stringify(updated));
      const reg = usersRegistry.map(u => u.id === auth.user!.id ? updated : u);
      setUsersRegistry(reg);
      await set('app_users_db', reg);
    } else {
      await supabase.from('profiles').update(data).eq('id', auth.user.id);
    }
  };

  // Restante das funções administrativas mockadas para Preview e reais para Supabase
  const getAllUsers = () => usersRegistry;
  const getPendingUsers = () => usersRegistry.filter(u => u.verificationStatus === VerificationStatus.PENDING);
  const getUserById = (id: string) => usersRegistry.find(u => u.id === id);

  const adminApproveKYC = async (uid: string) => {
    const reg = usersRegistry.map(u => u.id === uid ? { ...u, verificationStatus: VerificationStatus.VERIFIED, verified: true } : u);
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  const adminRejectKYC = async (uid: string) => {
    const reg = usersRegistry.map(u => u.id === uid ? { ...u, verificationStatus: VerificationStatus.REJECTED, verified: false } : u);
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  const adminUpdateUser = async (uid: string, data: Partial<User>) => {
    const reg = usersRegistry.map(u => u.id === uid ? { ...u, ...data } : u);
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  const deleteUser = async (uid: string) => {
    const reg = usersRegistry.filter(u => u.id !== uid);
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  const toggleUserStatus = async (uid: string) => {
    const reg = usersRegistry.map(u => u.id === uid ? { ...u, isActive: !u.isActive } : u);
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  const createCollaborator = async (data: any) => {
    const colab: User = { ...data, id: 'colab_' + Date.now(), joinedDate: new Date().toISOString(), isActive: true, plan: UserPlan.PREMIUM, verificationStatus: VerificationStatus.VERIFIED };
    const reg = [...usersRegistry, colab];
    setUsersRegistry(reg);
    await set('app_users_db', reg);
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, login, register, logout, updateUser, adminUpdateUser, 
      getUserById, getPendingUsers, getAllUsers, adminApproveKYC, adminRejectKYC,
      submitKYC: async (d, s) => updateUser({ documentUrl: d, selfieUrl: s, verificationStatus: VerificationStatus.PENDING }),
      deleteUser, toggleUserStatus, createCollaborator,
      isValidTaxId: (id, type) => id.replace(/\D/g, '').length === (type === UserType.PF ? 11 : 14),
      confirmarPagamento: async (v) => updateUser({ plan: v > 15 ? UserPlan.PREMIUM : UserPlan.BASIC })
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
