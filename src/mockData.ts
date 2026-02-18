
import { Item, Category, User, Review, UserPlan, UserType, VerificationStatus } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Carlos Silva',
    email: 'carlos@example.com',
    // Added missing role property to fix type error
    role: 'USER',
    userType: UserType.PF,
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 99999-8888',
    address: 'Rua Augusta',
    addressNumber: '1500',
    neighborhood: 'Consolação',
    zipCode: '01304-001',
    bio: 'Adoro reformar móveis e alugo minhas ferramentas nos finais de semana.',
    joinedDate: '2023-01-15',
    avatar: 'https://i.pravatar.cc/150?u=u1',
    verified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    shareAddress: true,
    plan: UserPlan.FREE,
    trustStats: {
        score: 85,
        level: 'SUPER',
        completedTransactions: 15,
        cancellations: 0,
        avgRatingAsOwner: 4.9,
        countRatingAsOwner: 12,
        avgRatingAsRenter: 5.0,
        countRatingAsRenter: 4
    }
  },
  {
    id: 'u2',
    name: 'Ana Souza',
    email: 'ana@example.com',
    // Added missing role property to fix type error
    role: 'USER',
    userType: UserType.PF,
    city: 'Rio de Janeiro',
    state: 'RJ',
    phone: '(21) 98888-7777',
    address: 'Av. Atlântica',
    addressNumber: '200',
    neighborhood: 'Copacabana',
    zipCode: '22021-001',
    bio: 'Fotógrafa amadora e gamer. Cuido muito bem dos meus equipamentos.',
    joinedDate: '2023-03-10',
    avatar: 'https://i.pravatar.cc/150?u=u2',
    verified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    shareAddress: false,
    plan: UserPlan.FREE,
    trustStats: {
        score: 72,
        level: 'TRUSTED',
        completedTransactions: 8,
        cancellations: 1,
        avgRatingAsOwner: 5.0,
        countRatingAsOwner: 5,
        avgRatingAsRenter: 4.8,
        countRatingAsRenter: 6
    }
  }
];

export const MOCK_ITEMS: Item[] = [
  {
    id: 'i1',
    ownerId: 'u1',
    ownerName: 'Carlos Silva',
    title: 'Furadeira de Impacto Bosch Professional',
    category: Category.TOOLS,
    description: 'Furadeira potente, ideal para concreto e madeira. Acompanha maleta e conjunto de brocas básicas.',
    images: ['https://picsum.photos/id/1/800/600', 'https://picsum.photos/id/2/800/600'],
    pricePerDay: 45,
    pricePerWeek: 250,
    pricePerMonth: 800,
    city: 'São Paulo',
    state: 'SP',
    lat: -23.5505,
    lng: -46.6333,
    createdAt: '2023-10-01',
    rating: 4.8,
    reviewCount: 12,
    available: true,
    deliveryConfig: {
        available: true,
        fee: 15.00,
        maxDistanceKm: 10,
        timeFrame: 'Até 2 horas'
    }
  },
  {
    id: 'i2',
    ownerId: 'u2',
    ownerName: 'Ana Souza',
    title: 'PlayStation 5 + 2 Controles',
    category: Category.GAMES,
    description: 'Console PS5 em perfeito estado com FIFA 24 e God of War instalados. Diversão garantida para o fim de semana.',
    images: ['https://picsum.photos/id/96/800/600', 'https://picsum.photos/id/160/800/600'],
    pricePerDay: 80,
    pricePerWeek: 450,
    pricePerMonth: 1500,
    city: 'Rio de Janeiro',
    state: 'RJ',
    lat: -22.9068,
    lng: -43.1729,
    createdAt: '2023-11-05',
    rating: 5.0,
    reviewCount: 5,
    available: true,
    deliveryConfig: {
        available: true,
        fee: 25.00,
        maxDistanceKm: 15,
        timeFrame: 'Mesmo dia'
    }
  },
  {
    id: 'i3',
    ownerId: 'u1',
    ownerName: 'Carlos Silva',
    title: 'Apartamento Studio Centro',
    category: Category.REAL_ESTATE,
    description: 'Studio mobiliado no centro da cidade. Wifi rápido, ar condicionado e perto do metrô. Ideal para estadias curtas.',
    images: ['https://picsum.photos/id/10/800/600', 'https://picsum.photos/id/11/800/600'],
    pricePerDay: 150,
    pricePerWeek: 900,
    pricePerMonth: 3000,
    city: 'São Paulo',
    state: 'SP',
    lat: -23.5489,
    lng: -46.6388,
    createdAt: '2023-09-20',
    rating: 4.5,
    reviewCount: 30,
    available: true,
    deliveryConfig: {
        available: false,
        fee: 0,
        maxDistanceKm: 0
    }
  },
  {
    id: 'i4',
    ownerId: 'u2',
    ownerName: 'Ana Souza',
    title: 'Barraca de Camping 4 Pessoas',
    category: Category.CAMPING,
    description: 'Barraca impermeável, fácil de montar. Ótima para fim de semana na praia ou montanha.',
    images: ['https://picsum.photos/id/292/800/600'],
    pricePerDay: 30,
    pricePerWeek: 150,
    pricePerMonth: 400,
    city: 'Rio de Janeiro',
    state: 'RJ',
    lat: -23.0000,
    lng: -43.3500,
    createdAt: '2023-12-01',
    rating: 4.2,
    reviewCount: 8,
    available: true,
    deliveryConfig: {
        available: true,
        fee: 20.00,
        maxDistanceKm: 5,
        timeFrame: '1 dia útil'
    }
  },
   {
    id: 'i5',
    ownerId: 'u1',
    ownerName: 'Carlos Silva',
    title: 'Câmera Canon EOS Rebel',
    category: Category.ELECTRONICS,
    description: 'Câmera DSLR perfeita para iniciantes e entusiastas. Inclui lente 18-55mm e cartão de memória.',
    images: ['https://picsum.photos/id/250/800/600'],
    pricePerDay: 100,
    pricePerWeek: 500,
    pricePerMonth: 1500,
    city: 'São Paulo',
    state: 'SP',
    lat: -23.5615,
    lng: -46.6559,
    createdAt: '2024-01-10',
    rating: 4.9,
    reviewCount: 15,
    available: true,
    deliveryConfig: {
        available: true,
        fee: 12.00,
        maxDistanceKm: 8,
        timeFrame: '30 min'
    }
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    transactionId: 't_mock_1',
    itemId: 'i1',
    reviewerId: 'u2',
    reviewedId: 'u1',
    reviewerName: 'Ana Souza',
    role: 'RENTER',
    rating: 5,
    criteria: { communication: 5, pontuality: 5, accuracy: 5, cleanliness: 5 },
    tags: ['Item como descrito', 'Boa comunicação'],
    comment: 'A furadeira funcionou perfeitamente. O Carlos foi muito atencioso na entrega.',
    date: '2023-10-15',
    isHidden: false,
    isAnonymous: false
  }
];
