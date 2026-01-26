
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserType, UserPlan, VerificationStatus, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  register: (data: any) => Promise<{success: boolean, needsConfirmation: boolean, message?: string}>;
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

  const mapProfile = useCallback((p: any, authUser?: any): User => ({
    ...p,
    id: p.id || authUser?.id,
    name: p.name || authUser?.user_metadata?.name || 'Usuário',
    email: p.email || authUser?.email,
    userType: p.user_type || authUser?.user_metadata?.user_type || 'Pessoa Física',
    zipCode: p.zip_code || authUser?.user_metadata?.zip_code,
    joinedDate: p.joined_date || new Date().toISOString(),
    verificationStatus: p.verification_status || 'Não Iniciado',
    isActive: p.is_active ?? true,
    plan: p.plan || 'Gratuito',
    role: p.role || 'USER',
    trustStats: p.trust_stats || { score: 50, level: 'NEUTRAL', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 5, countRatingAsOwner: 0, avgRatingAsRenter: 5, countRatingAsRenter: 0 }
  }), []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      if (data) setAllUsers(data.map(p => mapProfile(p)));
    } catch (e) {
      console.warn("Aviso: Falha ao sincronizar lista de perfis secundários.");
    }
  };

  const fetchProfile = async (userId: string, authUser?: any) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile) {
        setUser(mapProfile(profile, authUser));
      } else if (authUser) {
        setUser(mapProfile({ id: userId }, authUser));
      }
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await fetchProfile(session.user.id, session.user);
        }
      } catch (e) {
        console.error("Erro na inicialização:", e);
      } finally {
        if (mounted) {
          await fetchUsers();
          setIsLoading(false); // CARGA INICIAL FINALIZADA
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // REMOVIDO: INITIAL_SESSION para evitar loop de carregamento
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          try {
            // Sincroniza dados mas sem re-ativar o loading se já estivermos logados
            // para evitar o efeito de "piscar" a tela de Splash
            await Promise.all([
              fetchProfile(session.user.id, session.user),
              fetchUsers()
            ]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAllUsers([]);
        setIsLoading(false);
      } else {
        // Catch-all para garantir que NENHUM evento deixe o app preso em loading
        setIsLoading(false);
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [mapProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          return { success: false, message: "⚠️ E-mail não confirmado! Verifique sua caixa de entrada." };
        }
        return { success: false, message: "E-mail ou senha incorretos." };
      }
      return { success: !!data.user };
    } catch (e) {
      return { success: false, message: "Erro ao tentar entrar." };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      if (authError) throw authError;

      const needsConfirmation = !authData.session && !!authData.user;
      
      return { 
        success: true, 
        needsConfirmation,
        message: needsConfirmation ? "Verifique seu e-mail para ativar sua conta." : "Cadastro realizado com sucesso!"
      };
    } catch (err: any) {
      return { 
        success: false, 
        needsConfirmation: false, 
        message: err.message || "Erro ao realizar cadastro." 
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(data as any).eq('id', user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
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
    await fetchProfile(user.id);
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
    await fetchProfile(user.id);
  };

  const cancelarAssinatura = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ plan: UserPlan.FREE }).eq('id', user.id);
    await fetchProfile(user.id);
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
