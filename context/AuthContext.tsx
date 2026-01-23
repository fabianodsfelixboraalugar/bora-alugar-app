
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';

interface AuthContextType extends AuthState {
  isLoading: boolean;
  allUsers: User[];
  login: (email: string, password?: string) => Promise<boolean>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  getUserById: (id: string) => User | undefined;
  getPendingUsers: () => User[];
  adminUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  cancelarAssinatura: () => Promise<void>;
  confirmarPagamento: (valor: number) => Promise<void>;
  submitKYC: (documentUrl: string, selfieUrl: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  adminApproveKYC: (userId: string) => Promise<void>;
  adminRejectKYC: (userId: string) => Promise<void>;
  createCollaborator: (data: any) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  isValidTaxId: (taxId: string, type: UserType) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      if (data) setAllUsers(data as User[]);
    } catch (err) {
      console.warn("Erro ao buscar usuários. Verifique se o script SQL foi executado.");
    }
  };

  const createInitialProfile = async (userId: string, email: string, name: string) => {
    const profile = {
      id: userId,
      name: name || email.split('@')[0],
      email: email,
      joinedDate: new Date().toISOString(),
      plan: UserPlan.FREE,
      role: 'USER',
      verificationStatus: VerificationStatus.NOT_STARTED,
      isActive: true,
      trustStats: { score: 50, level: 'NEUTRAL', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 0, countRatingAsOwner: 0, avgRatingAsRenter: 0, countRatingAsRenter: 0 }
    };
    const { error } = await supabase.from('profiles').insert([profile]);
    return { data: profile, error };
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Auto-Repair: Se logado mas sem perfil, cria um
        if (error && session.user.id) {
          console.log("Perfil não encontrado. Criando perfil inicial...");
          const { data: newProfile } = await createInitialProfile(session.user.id, session.user.email!, '');
          profile = newProfile;
        }

        if (profile) {
          setAuth({ user: profile as User, isAuthenticated: true });
        }
      }
      await fetchUsers();
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setAuth({ user: profile as User, isAuthenticated: true });
        } else {
          // Fallback se perfil ainda estiver sendo criado no register
          setAuth({ user: { id: session.user.id, email: session.user.email, name: 'Carregando...' } as any, isAuthenticated: true });
        }
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
      await fetchUsers();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const isAdminAttempt = email.startsWith('*');
    const targetEmail = isAdminAttempt ? email.substring(1) : email;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password || '',
    });

    if (error || !data.user) {
      setIsLoading(false);
      return false;
    }

    // Verifica acesso admin
    if (isAdminAttempt) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, jobTitle')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'ADMIN' && !profile?.jobTitle) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return false;
      }
    }

    setIsLoading(false);
    return true;
  };

  const register = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error || !data.user) throw error;

    const newUserProfile: any = {
      id: data.user.id,
      name: userData.name,
      email: userData.email,
      userType: userData.userType,
      city: userData.city,
      state: userData.state,
      zipCode: userData.zipCode,
      joinedDate: new Date().toISOString(),
      plan: UserPlan.FREE,
      role: 'USER',
      verificationStatus: VerificationStatus.NOT_STARTED,
      isActive: true,
      trustStats: {
        score: 50,
        level: 'NEUTRAL',
        completedTransactions: 0,
        cancellations: 0,
        avgRatingAsOwner: 0,
        countRatingAsOwner: 0,
        avgRatingAsRenter: 0,
        countRatingAsRenter: 0
      }
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([newUserProfile]);

    if (profileError) {
      console.error("Erro ao criar perfil. Verifique as colunas do banco:", profileError);
      throw profileError;
    }
    await fetchUsers();
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
      setAuth({ ...auth, user: { ...auth.user, ...data } });
      await fetchUsers();
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const { data } = await supabase.from('profiles').select('*');
    return (data as User[]) || [];
  };

  const getUserById = (id: string) => allUsers.find(u => u.id === id);
  const getPendingUsers = () => allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING);

  const adminUpdateUser = async (userId: string, data: Partial<User>) => {
    await supabase.from('profiles').update(data).eq('id', userId);
    await fetchUsers();
  };

  const cancelarAssinatura = async () => {
    await updateUser({ plan: UserPlan.FREE, planAutoRenew: false });
  };

  const confirmarPagamento = async (valor: number) => {
    const newPlan = valor > 10 ? UserPlan.PREMIUM : UserPlan.BASIC;
    await updateUser({ plan: newPlan, planAutoRenew: true });
  };

  const submitKYC = async (documentUrl: string, selfieUrl: string) => {
    await updateUser({ 
      documentUrl, 
      selfieUrl, 
      verificationStatus: VerificationStatus.PENDING 
    } as any);
  };

  const deleteUser = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
    await fetchUsers();
  };

  const adminApproveKYC = async (userId: string) => {
    const target = getUserById(userId);
    await adminUpdateUser(userId, { 
      verificationStatus: VerificationStatus.VERIFIED, 
      verified: true,
      trustStats: { ...target?.trustStats!, score: 75 } as any
    });
  };

  const adminRejectKYC = async (userId: string) => {
    await adminUpdateUser(userId, { verificationStatus: VerificationStatus.REJECTED, verified: false });
  };

  const createCollaborator = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error || !data.user) throw error;

    const newUserProfile: any = {
      id: data.user.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'USER',
      jobTitle: userData.jobTitle,
      avatar: userData.avatar,
      userType: UserType.PF,
      joinedDate: new Date().toISOString(),
      plan: UserPlan.PREMIUM,
      isActive: true,
      verified: true,
      verificationStatus: VerificationStatus.VERIFIED
    };

    await supabase.from('profiles').insert([newUserProfile]);
    await fetchUsers();
  };

  const toggleUserStatus = async (userId: string) => {
    const target = getUserById(userId);
    if (!target) return;
    await adminUpdateUser(userId, { isActive: !target.isActive });
  };

  const isValidTaxId = (taxId: string, type: UserType): boolean => {
    const clean = taxId.replace(/\D/g, '');
    return type === UserType.PF ? clean.length === 11 : clean.length === 14;
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, 
      allUsers,
      isLoading, 
      login, 
      register, 
      logout, 
      updateUser, 
      getAllUsers, 
      getUserById,
      getPendingUsers,
      adminUpdateUser,
      cancelarAssinatura,
      confirmarPagamento,
      submitKYC,
      deleteUser,
      adminApproveKYC,
      adminRejectKYC,
      createCollaborator,
      toggleUserStatus,
      isValidTaxId
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
