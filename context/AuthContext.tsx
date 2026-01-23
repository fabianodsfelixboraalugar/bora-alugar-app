
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserType, UserPlan, VerificationStatus, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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
    userType: p.user_type,
    zipCode: p.zip_code,
    joinedDate: p.joined_date,
    verificationStatus: p.verification_status,
    isActive: p.is_active,
    trustStats: p.trust_stats
  });

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setAllUsers(data.map(mapProfile));
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUser(mapProfile(profile));
      }
      await fetchUsers();
      setIsLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUser(mapProfile(profile));
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    return !!data.user;
  };

  const register = async (data: any) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      if (authError.status === 429) throw new Error("Muitas tentativas! Aguarde 1 minuto para tentar novamente.");
      throw authError;
    }

    if (authData.user) {
      const profile = {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        user_type: data.userType,
        zip_code: data.zipCode,
        city: data.city,
        state: data.state,
        role: 'USER',
        plan: UserPlan.FREE,
        verification_status: VerificationStatus.NOT_STARTED,
        is_active: true,
        trust_stats: { score: 50, level: 'NEUTRAL', completed_transactions: 0, cancellations: 0, avg_rating_as_owner: 0, count_rating_as_owner: 0, avg_rating_as_renter: 0, count_rating_as_renter: 0 }
      };
      const { error: profileError } = await supabase.from('profiles').insert([profile]);
      if (profileError) console.error("Erro ao criar perfil:", profileError);
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
    // Para simplificar, colaboradores são criados via registro normal
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
