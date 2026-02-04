
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  register: (user: any) => Promise<void>;
  createCollaborator: (data: { name: string, email: string, password: string, avatar: string, jobTitle: string, role: UserRole }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  adminUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getPendingUsers: () => User[];
  getAllUsers: () => User[];
  adminApproveKYC: (userId: string) => Promise<void>;
  adminRejectKYC: (userId: string) => Promise<void>;
  confirmarPagamento: (valor: number) => Promise<void>;
  submitKYC: (documentUrl: string, selfieUrl: string) => Promise<void>;
  isValidTaxId: (id: string, type: UserType) => boolean;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);

  useEffect(() => {
    const init = async () => {
      const stored = await get<User[]>('app_users_db');
      let initialRegistry: User[] = [];

      if (stored) {
        initialRegistry = stored.map(u => ({ ...u, isActive: u.isActive !== undefined ? u.isActive : true }));
      } else {
        initialRegistry = MOCK_USERS.map(u => ({ ...u, role: 'USER', isActive: true })) as User[];
        const joao = initialRegistry.find(u => u.email === 'joao.alugador@teste.com');
        if (joao) joao.role = 'ADMIN';
        await set('app_users_db', initialRegistry);
      }
      
      setUsersRegistry(initialRegistry);

      const active = localStorage.getItem('app_user');
      if (active) {
        const parsedUser = JSON.parse(active);
        const registryUser = initialRegistry.find(u => u.id === parsedUser.id);
        
        if (registryUser && registryUser.isActive !== false) {
          setAuth({ user: registryUser, isAuthenticated: true });
        } else {
          localStorage.removeItem('app_user');
          setAuth({ user: null, isAuthenticated: false });
        }
      }
    };
    init();
  }, []);

  const isValidTaxId = (id: string, type: UserType): boolean => {
    const clean = id.replace(/\D/g, '');
    return type === UserType.PF ? clean.length === 11 : clean.length === 14;
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const MASTER_EMAIL = "fabianodsfelix@gmail.com";
    const MASTER_LOGIN = "*" + MASTER_EMAIL;
    const MASTER_PASS = "84265.+-*/";

    const currentDb = await get<User[]>('app_users_db') || usersRegistry;

    if (email === MASTER_LOGIN && password === MASTER_PASS) {
        let masterUser = currentDb.find(u => u.email === MASTER_EMAIL);
        
        if (!masterUser) {
            masterUser = {
                id: 'u_master_fabiano',
                name: 'Fabiano Félix (Master)',
                email: MASTER_EMAIL,
                role: 'ADMIN',
                userType: UserType.PF,
                city: 'São Paulo',
                joinedDate: new Date().toISOString().split('T')[0],
                plan: UserPlan.PREMIUM,
                verificationStatus: VerificationStatus.VERIFIED,
                verified: true,
                isActive: true,
                avatar: 'https://ui-avatars.com/api/?name=Fabiano+Felix&background=58B83F&color=fff',
                trustStats: { score: 100, level: 'SUPER', completedTransactions: 999, cancellations: 0, avgRatingAsOwner: 5, countRatingAsOwner: 0, avgRatingAsRenter: 5, countRatingAsRenter: 0 }
            };
            const updated = [...currentDb, masterUser];
            setUsersRegistry(updated);
            await set('app_users_db', updated);
        }

        if (masterUser.isActive === false) {
          alert("Acesso mestre inativado. Contacte suporte técnico.");
          return false;
        }

        setAuth({ user: masterUser, isAuthenticated: true });
        localStorage.setItem('app_user', JSON.stringify(masterUser));
        return true;
    }

    let user = currentDb.find(u => u.email === email);
    
    if (user && user.password && user.password !== password) {
        return false;
    }

    if (user) {
      if (user.isActive === false) {
        alert("Sua conta está inativa. Entre em contato com o administrador.");
        return false;
      }
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('app_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = async (userData: any) => {
    const isTestAdmin = userData.email === 'joao.alugador@teste.com' || userData.email === 'fabianodsfelix@gmail.com';
    const newUser: User = {
      ...userData,
      id: isTestAdmin ? `u_admin_${userData.email.split('@')[0]}` : 'u_' + Date.now(),
      role: isTestAdmin ? 'ADMIN' : 'USER',
      joinedDate: new Date().toISOString().split('T')[0],
      plan: UserPlan.FREE,
      verificationStatus: VerificationStatus.NOT_STARTED,
      verified: false,
      isActive: true,
      trustStats: { score: 50, level: 'NEUTRAL', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 0, countRatingAsOwner: 0, avgRatingAsRenter: 0, countRatingAsRenter: 0 }
    };

    const updated = [...usersRegistry.filter(u => u.email !== userData.email), newUser];
    setUsersRegistry(updated);
    await set('app_users_db', updated);
    setAuth({ user: newUser, isAuthenticated: true });
    localStorage.setItem('app_user', JSON.stringify(newUser));
  };

  const createCollaborator = async (data: { name: string, email: string, password: string, avatar: string, jobTitle: string, role: UserRole }) => {
    const newUser: User = {
      id: 'colab_' + Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      jobTitle: data.jobTitle,
      avatar: data.avatar,
      userType: UserType.PF,
      city: 'Sistema',
      joinedDate: new Date().toISOString().split('T')[0],
      plan: UserPlan.PREMIUM,
      verificationStatus: VerificationStatus.VERIFIED,
      verified: true,
      isActive: true,
      trustStats: { score: 100, level: 'SUPER', completedTransactions: 0, cancellations: 0, avgRatingAsOwner: 5, countRatingAsOwner: 0, avgRatingAsRenter: 5, countRatingAsRenter: 0 }
    };

    const updated = [...usersRegistry, newUser];
    setUsersRegistry(updated);
    await set('app_users_db', updated);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!auth.user) return;
    const updatedUser = { ...auth.user, ...data };
    setAuth({ ...auth, user: updatedUser });
    localStorage.setItem('app_user', JSON.stringify(updatedUser));
    const updatedRegistry = usersRegistry.map(u => u.id === auth.user!.id ? updatedUser : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
  };

  const adminUpdateUser = async (userId: string, data: Partial<User>) => {
    const updatedRegistry = usersRegistry.map(u => u.id === userId ? { ...u, ...data } : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    
    // Se estivermos atualizando o próprio usuário logado, atualiza o estado de auth
    if (auth.user?.id === userId) {
      const updatedUser = updatedRegistry.find(u => u.id === userId)!;
      setAuth({ ...auth, user: updatedUser });
      localStorage.setItem('app_user', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = async (userId: string) => {
    const currentUsers = await get<User[]>('app_users_db') || [...usersRegistry];
    const updated = currentUsers.filter(u => u.id !== userId);
    await set('app_users_db', updated);
    setUsersRegistry(updated);
    if (auth.user?.id === userId) {
      localStorage.removeItem('app_user');
      setAuth({ user: null, isAuthenticated: false });
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const targetUser = usersRegistry.find(u => u.id === userId);
    const MASTER_EMAIL = "fabianodsfelix@gmail.com";
    
    // Trava lógica por ID e por Email para segurança máxima
    if (userId === 'u_master_fabiano' || userId === 'u_admin_fabianodsfelix' || targetUser?.email === MASTER_EMAIL) {
       alert("Operação negada: A conta do Administrador Master é protegida pelo sistema e não pode ser desativada.");
       return;
    }
    
    const updatedRegistry = usersRegistry.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    );
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    
    // Se o usuário logado for desativado por outro admin, desconectar
    const updatedTargetUser = updatedRegistry.find(u => u.id === userId);
    if (auth.user?.id === userId && updatedTargetUser?.isActive === false) {
      logout();
    }
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('app_user');
  };

  const getPendingUsers = () => usersRegistry.filter(u => u.verificationStatus === VerificationStatus.PENDING);
  const getAllUsers = () => usersRegistry;

  const adminApproveKYC = async (userId: string) => {
    const updatedRegistry = usersRegistry.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          verificationStatus: VerificationStatus.VERIFIED,
          verified: true,
          trustStats: { ...u.trustStats, score: 95, level: 'SUPER' }
        };
      }
      return u;
    }) as User[];
    
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    
    if (auth.user?.id === userId) {
      const updatedUser = updatedRegistry.find(u => u.id === userId)!;
      setAuth({ ...auth, user: updatedUser });
      localStorage.setItem('app_user', JSON.stringify(updatedUser));
    }
  };

  const adminRejectKYC = async (userId: string) => {
    const updatedRegistry = usersRegistry.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          verificationStatus: VerificationStatus.REJECTED,
          verified: false
        };
      }
      return u;
    }) as User[];
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
  };

  const submitKYC = async (doc: string, selfie: string) => {
    await updateUser({ 
      verificationStatus: VerificationStatus.PENDING,
      documentUrl: doc,
      selfieUrl: selfie
    });
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, login, register, createCollaborator, logout, updateUser, adminUpdateUser, getPendingUsers, getAllUsers, adminApproveKYC, adminRejectKYC,
      getUserById: (id) => usersRegistry.find(u => u.id === id),
      confirmarPagamento: async (valor) => {
          await updateUser({ plan: valor > 15 ? UserPlan.PREMIUM : UserPlan.BASIC });
          alert("Plano atualizado com sucesso!");
      },
      submitKYC, isValidTaxId, deleteUser, toggleUserStatus
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
