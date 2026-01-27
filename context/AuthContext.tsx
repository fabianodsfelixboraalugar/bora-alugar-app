
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { useData } from './DataContext';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  adminApproveKYC: (userId: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addLog } = useData();
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);

  useEffect(() => {
    // 1. Verificar sessão ativa no Supabase
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }

      // 2. Carregar lista de usuários (para contexto de Admin e busca)
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setUsersRegistry(profiles as User[]);
    };

    initAuth();

    // Listener de mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setAuth({ user: profile as User, isAuthenticated: true });
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });

    if (error) {
      addLog('LOGIN_FALHA', `Erro: ${error.message}`, undefined, email);
      return false;
    }

    addLog('LOGIN_SUCESSO', 'Usuário logado via Supabase Auth', data.user.id, email);
    return true;
  };

  const register = async (userData: any) => {
    // 1. Auth no Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const newUserProfile: User = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: 'USER',
        userType: userData.userType,
        city: userData.city,
        joinedDate: new Date().toISOString(),
        plan: UserPlan.FREE,
        verificationStatus: VerificationStatus.NOT_STARTED,
        verified: false,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name),
        trustStats: { score: 50, level: 'NEUTRAL', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 0, countRatingAsOwner: 0, avgRatingAsRenter: 0, countRatingAsRenter: 0 }
      };

      // 2. Salvar perfil na tabela de profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([newUserProfile]);

      if (profileError) throw profileError;

      addLog('CADASTRO_NOVO', `Novo usuário registrado: ${userData.email}`, authData.user.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false });
  };

  const updateUser = async (data: Partial<User>) => {
    if (!auth.user) return;
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', auth.user.id);

    if (!error) {
      setAuth(prev => ({ ...prev, user: { ...prev.user!, ...data } }));
    }
  };

  const adminApproveKYC = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ verificationStatus: VerificationStatus.VERIFIED, verified: true })
      .eq('id', userId);
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, login, register, logout, updateUser, adminApproveKYC,
      getUserById: (id) => usersRegistry.find(u => u.id === id)
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
