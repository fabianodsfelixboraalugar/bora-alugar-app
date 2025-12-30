
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { User, AuthState, UserPlan, VerificationStatus, UserType, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';
import { useData } from './DataContext';

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
  cancelarAssinatura: () => Promise<void>;
  submitKYC: (documentUrl: string, selfieUrl: string) => Promise<void>;
  isValidTaxId: (id: string, type: UserType) => boolean;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
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
    const init = async () => {
      try {
        const stored = (await get('app_users_db')) as User[] | undefined;
        let initialRegistry: User[] = [];

        if (stored) {
          initialRegistry = stored.map(u => ({ ...u, isActive: u.isActive !== undefined ? u.isActive : true }));
        } else {
          initialRegistry = MOCK_USERS.map(u => ({ ...u, role: 'USER', isActive: true, plan: UserPlan.FREE })) as User[];
          const joao = initialRegistry.find(u => u.email === 'joao.alugador@teste.com');
          if (joao) joao.role = 'ADMIN';
          await set('app_users_db', initialRegistry);
        }
        
        setUsersRegistry(initialRegistry);

        const active = localStorage.getItem('app_user');
        if (active) {
          try {
            const parsedUser = JSON.parse(active);
            const registryUser = initialRegistry.find(u => u.id === parsedUser.id);
            
            if (registryUser && registryUser.isActive !== false) {
              setAuth({ user: registryUser, isAuthenticated: true });
            } else {
              localStorage.removeItem('app_user');
              setAuth({ user: null, isAuthenticated: false });
            }
          } catch (e) {
            console.error("Erro ao processar dados do usuário salvo:", e);
            localStorage.removeItem('app_user');
          }
        }
      } catch (err) {
        console.error("Erro crítico na inicialização do AuthContext:", err);
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

    const currentDb = ((await get('app_users_db')) as User[] | undefined) || usersRegistry;

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
          addLog('LOGIN_NEGADO', `Tentativa de login mestre inativo: ${email}`);
          alert("Acesso mestre inativado. Contacte suporte técnico.");
          return false;
        }

        setAuth({ user: masterUser, isAuthenticated: true });
        localStorage.setItem('app_user', JSON.stringify(masterUser));
        addLog('LOGIN_SUCESSO', 'Administrador Master logado com sucesso.', masterUser.id, masterUser.email);
        return true;
    }

    let user = currentDb.find(u => u.email === email);
    
    if (user && user.password && user.password !== password) {
        addLog('LOGIN_FALHA', `Senha incorreta para o e-mail: ${email}`);
        return false;
    }

    if (user) {
      if (user.isActive === false) {
        addLog('LOGIN_NEGADO', `Tentativa de login em conta inativa: ${email}`, user.id);
        alert("Sua conta está inativa. Entre em contato com o administrador.");
        return false;
      }
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('app_user', JSON.stringify(user));
      addLog('LOGIN_SUCESSO', 'Usuário logado com sucesso.', user.id, user.email);
      return true;
    }
    addLog('LOGIN_FALHA', `E-mail não encontrado: ${email}`);
    return false;
  };

  const register = async (userData: any) => {
    const isTestAdmin = userData.email === 'joao.alugador@teste.com' || userData.email === 'fabianodsfelix@gmail.com';
    const newUser: User = {
      ...userData,
      id: isTestAdmin ? `u_admin_${userData.email.split('@')[0]}` : 'u_' + Date.now(),
      avatar: userData.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
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
    addLog('CADASTRO_NOVO', `Novo usuário registrado via plataforma.`, newUser.id, newUser.email);
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
    addLog('COLABORADOR_CRIADO', `Colaborador ${data.name} criado pelo administrador.`, newUser.id, newUser.email);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!auth.user) return;
    const updatedUser = { ...auth.user, ...data };
    setAuth({ ...auth, user: updatedUser });
    localStorage.setItem('app_user', JSON.stringify(updatedUser));
    const updatedRegistry = usersRegistry.map(u => u.id === auth.user!.id ? updatedUser : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    addLog('PERFIL_ATUALIZADO', `Usuário atualizou dados próprios.`, auth.user.id);
  };

  const adminUpdateUser = async (userId: string, data: Partial<User>) => {
    const updatedRegistry = usersRegistry.map(u => u.id === userId ? { ...u, ...data } : u);
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    
    if (auth.user?.id === userId) {
      const updatedUser = updatedRegistry.find(u => u.id === userId)!;
      setAuth({ ...auth, user: updatedUser });
      localStorage.setItem('app_user', JSON.stringify(updatedUser));
    }
    addLog('ADMIN_UPDATE_USER', `Administrador alterou dados do usuário ID: ${userId}`);
  };

  const deleteUser = async (userId: string) => {
    const currentUsers = ((await get('app_users_db')) as User[] | undefined) || [...usersRegistry];
    const updated = currentUsers.filter(u => u.id !== userId);
    await set('app_users_db', updated);
    setUsersRegistry(updated);
    if (auth.user?.id === userId) {
      localStorage.removeItem('app_user');
      setAuth({ user: null, isAuthenticated: false });
    }
    addLog('ADMIN_DELETE_USER', `Administrador removeu permanentemente o usuário ID: ${userId}`);
  };

  const toggleUserStatus = async (userId: string) => {
    const targetUser = usersRegistry.find(u => u.id === userId);
    const MASTER_EMAIL = "fabianodsfelix@gmail.com";
    
    if (userId === 'u_master_fabiano' || userId === 'u_admin_fabianodsfelix' || targetUser?.email === MASTER_EMAIL) {
       alert("Operação negada: A conta do Administrador Master é protegida pelo sistema e não pode ser desativada.");
       return;
    }
    
    const updatedRegistry = usersRegistry.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    );
    setUsersRegistry(updatedRegistry);
    await set('app_users_db', updatedRegistry);
    
    const updatedTargetUser = updatedRegistry.find(u => u.id === userId);
    if (auth.user?.id === userId && updatedTargetUser?.isActive === false) {
      logout();
    }
    addLog('ADMIN_TOGGLE_STATUS', `Status de atividade do usuário ${userId} alterado para ${updatedTargetUser?.isActive}`);
  };

  const logout = () => {
    if (auth.user) addLog('LOGOUT', 'Usuário desconectou.', auth.user.id);
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
    addLog('ADMIN_APPROVE_KYC', `Identidade do usuário ${userId} APROVADA.`);
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
    addLog('ADMIN_REJECT_KYC', `Identidade do usuário ${userId} REPROVADA.`);
  };

  const submitKYC = async (doc: string, selfie: string) => {
    await updateUser({ 
      verificationStatus: VerificationStatus.PENDING,
      documentUrl: doc,
      selfieUrl: selfie
    });
    addLog('SUBMIT_KYC', `Usuário enviou documentos para verificação.`);
  };

  const confirmarPagamento = async (valor: number) => {
    const proximaExp = new Date();
    proximaExp.setMonth(proximaExp.getMonth() + 1);
    
    const novoPlano = valor > 40 ? UserPlan.PREMIUM : UserPlan.BASIC;
    
    await updateUser({ 
        plan: novoPlano,
        planExpiration: proximaExp.toISOString(),
        planAutoRenew: true
    });
    
    addLog('PAGAMENTO_CONFIRMADO', `Assinatura ${novoPlano} ativada via gateway.`, auth.user?.id);
    alert(`Pagamento confirmado! Seu plano agora é: ${novoPlano}`);
  };

  const cancelarAssinatura = async () => {
    await updateUser({ planAutoRenew: false });
    addLog('ASSINATURA_CANCELADA', `Usuário desativou renovação automática.`, auth.user?.id);
    alert("Renovação automática cancelada. Seu plano atual continuará ativo até o fim do período.");
  };

  return (
    <AuthContext.Provider value={{ 
      ...auth, login, register, createCollaborator, logout, updateUser, adminUpdateUser, getPendingUsers, getAllUsers, adminApproveKYC, adminRejectKYC,
      getUserById: (id) => usersRegistry.find(u => u.id === id),
      confirmarPagamento,
      cancelarAssinatura,
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
