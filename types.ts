
export enum Category {
  TOOLS = 'Ferramentas',
  REAL_ESTATE = 'Imóveis',
  GAMES = 'Games',
  CAMPING = 'Camping',
  ELECTRONICS = 'Eletrônicos',
  VEHICLES = 'Veículos',
  PARTY = 'Festas',
  APPLIANCES = 'Eletrodomésticos',
  OTHER = 'Outros'
}

export enum UserPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export enum VerificationStatus {
  NOT_STARTED = 'Não Iniciado',
  PENDING = 'Pendente',
  VERIFIED = 'Verificado',
  REJECTED = 'Rejeitado'
}

export enum UserType {
  PF = 'Pessoa Física',
  PJ = 'Pessoa Jurídica'
}

export enum ItemStatus {
  AVAILABLE = 'Disponível',
  RENTED = 'Alugado',
  MAINTENANCE = 'Manutenção'
}

export type UserRole = 'ADMIN' | 'USER';

export interface TrustStats {
  score: number;
  level: 'RISK' | 'NEUTRAL' | 'TRUSTED' | 'SUPER';
  completedTransactions: number;
  cancellations: number;
  avgRatingAsOwner: number;
  countRatingAsOwner: number;
  avgRatingAsRenter: number;
  countRatingAsRenter: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  jobTitle?: string;
  cpf?: string;
  cnpj?: string;
  userType: UserType;
  city: string;
  state?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  joinedDate: string;
  trustStats?: TrustStats;
  verified?: boolean;
  verificationStatus: VerificationStatus;
  documentUrl?: string;
  selfieUrl?: string;
  shareAddress?: boolean; 
  blockedUserIds?: string[];
  plan: UserPlan;
  isActive?: boolean;
}

export interface DeliveryConfig {
  available: boolean;
  fee: number;
  maxDistanceKm: number;
  timeFrame?: string;
}

export interface Item {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  category: Category;
  description: string;
  contractTerms?: string;
  images: string[];
  videoUrl?: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  deliveryConfig: DeliveryConfig;
  city: string;
  state: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
  available: boolean;
  status?: ItemStatus; // Campo opcional para suporte PJ
  lat?: number;
  lng?: number;
  distance?: number;
}

export enum RentalStatus {
  PENDING = 'Pendente',
  CONFIRMED = 'Confirmado',
  SHIPPED = 'A Caminho',
  DELIVERED = 'Entregue',
  ACTIVE = 'Em Uso',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado'
}

export interface DeliveryInfo {
  method: 'PICKUP' | 'DELIVERY';
  fee: number;
  address?: string;
  trackingHistory?: { status: string, timestamp: string }[];
}

export interface Rental {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: RentalStatus;
  createdAt: string;
  deliveryInfo: DeliveryInfo;
  contractAccepted?: boolean;
}

export enum NotificationType {
  RENTAL_REQUEST = 'RENTAL_REQUEST',
  RENTAL_UPDATE = 'RENTAL_UPDATE',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface Review {
  id: string;
  transactionId: string;
  itemId?: string;
  reviewerId: string;
  reviewedId: string;
  reviewerName: string;
  role: 'OWNER' | 'RENTER';
  rating: number;
  criteria: {
    communication: number;
    pontuality: number;
    accuracy?: number;
    cleanliness?: number;
    care?: number;
  };
  tags: string[];
  comment: string;
  date: string;
  isHidden: boolean;
  isAnonymous: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
