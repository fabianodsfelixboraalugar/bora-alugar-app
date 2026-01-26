
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserType, UserPlan, VerificationStatus, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getAllUsers: () => Promise<User[]>;
  getPendingUsers: () => User[];
  submitKYC: (documentUrl: string, selfieUrl: string) => Promise<void>;
  adminApproveKYC: (userId: string) => Promise<void>;
  adminRejectKYC: (userId: string) => Promise<void>;
  adminUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  createCollaborator: (data: any) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  confirmarPagamento: (valor: number) => Promise<void>;
  cancelarAssinatura: () => Promise<void>;
  isValidTaxId: (taxId: string, type: UserType) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapProfile = (p: any): User => ({
    ...p,
    userType: p.user_type || 'Pessoa Física',
    zipCode: p.zip_code,
    joinedDate: p.joined_date,
    verificationStatus: p.verification_status || 'Não Iniciado',
    isActive: p.is_active ?? true,
    trustStats: p.trust_stats || { score: 50, level: 'NEUTRAL' }
  });

  const fetchUsers = async () => {
    try {
      const { data, error, status } = await supabase.from('profiles').select('*');
      if (error) {
        if (error.code === 'PGRST301' || status === 401) return;
        throw error;
      }
      if (data) setAllUsers(data.map(mapProfile));
    } catch (e) {
      console.warn("Aviso ao buscar perfis:", e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.status === 401 || sessionError.status === 400) {
            await supabase.auth.signOut();
          }
        }

        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profile) {
            setUser(mapProfile(profile));
          }
        }
      } catch (e) {
        console.warn("Auth initialization warning:", e);
      } finally {
        await fetchUsers();
        setIsLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAllUsers([]);
      } else if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) setUser(mapProfile(profile));
      }
      await fetchUsers();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          return { success: false, message: "⚠️ E-mail não confirmado! Verifique sua caixa de entrada e clique no link de ativação." };
        }
        if (error.status === 429) {
          return { success: false, message: "⚠️ Muitas tentativas! Por favor, aguarde 60 segundos." };
        }
        return { success: false, message: error.message || "E-mail ou senha incorretos." };
      }
      
      return { success: !!data.user };
    } catch (e) {
      return { success: false, message: "Erro inesperado ao tentar entrar." };
    }
  };

  const register = async (data: any) => {
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.userType,
          tax_id: data.taxId,
          zip_code: data.zipCode,
          city: data.city,
          state: data.state
        }
      }
    });

    if (authError) {
      if (authError.status === 429) {
        throw new Error("MUITAS TENTATIVAS: O servidor bloqueou temporariamente. Aguarde 60 segundos.");
      }
      if (authError.status === 422) {
        throw new Error("ERRO DE VALIDAÇÃO: Verifique se todos os campos estão corretos ou se o e-mail já existe.");
      }
      throw authError;
    }
    
    await fetchUsers();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name) dbData.name = data.name;
    if (data.avatar) dbData.avatar = data.avatar;
    if (data.city) dbData.city = data.city;
    
    await supabase.from('profiles').update(dbData).eq('id', user.id);
    await fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
    await fetchUsers();
  };

  const getUserById = (id: string) => allUsers.find(u => u.id === id);
  const getAllUsers = async () => { await fetchUsers(); return allUsers; };
  const getPendingUsers = () => allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const submitKYC = async (doc: string, self: string) => {
    if (!user) return;
    await supabase.from('profiles').update({
      verification_status: VerificationStatus.PENDING,
      document_url: doc,
      selfie_url: self
    }).eq('id', user.id);
    await fetchUsers();
  };

  const adminApproveKYC = async (uid: string) => {
    await supabase.from('profiles').update({ verification_status: VerificationStatus.VERIFIED, verified: true }).eq('id', uid);
    await fetchUsers();
  };

  const adminRejectKYC = async (uid: string) => {
    await supabase.from('profiles').update({ verification_status: VerificationStatus.REJECTED }).eq('id', uid);
    await fetchUsers();
  };

  const adminUpdateUser = async (uid: string, data: Partial<User>) => {
    await supabase.from('profiles').update(data as any).eq('id', uid);
    await fetchUsers();
  };

  const createCollaborator = async (data: any) => {
    await register(data);
  };

  const toggleUserStatus = async (uid: string) => {
    const u = getUserById(uid);
    if (!u) return;
    await supabase.from('profiles').update({ is_active: !u.isActive }).eq('id', uid);
    await fetchUsers();
  };

  const confirmarPagamento = async (valor: number) => {
    if (!user) return;
    const plan = valor > 10 ? UserPlan.PREMIUM : UserPlan.BASIC;
    await supabase.from('profiles').update({ plan }).eq('id', user.id);
    await fetchUsers();
  };

  const cancelarAssinatura = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ plan: UserPlan.FREE }).eq('id', user.id);
    await fetchUsers();
  };

  const isValidTaxId = (taxId: string, type: UserType) => {
    const clean = taxId.replace(/\D/g, '');
    return type === UserType.PF ? clean.length === 11 : clean.length === 14;
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated: !!user, allUsers, isLoading, login, register, logout, updateUser, deleteUser,
      getUserById, getAllUsers, getPendingUsers, submitKYC, adminApproveKYC, adminRejectKYC,
      adminUpdateUser, createCollaborator, toggleUserStatus, confirmarPagamento, cancelarAssinatura, isValidTaxId
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
