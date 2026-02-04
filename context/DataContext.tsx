
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { Item, Rental, Review, RentalStatus, Message, User, VerificationStatus, Notification, NotificationType, TrustStats } from '../types';
import { MOCK_ITEMS, MOCK_REVIEWS, MOCK_USERS } from '../mockData';

interface Coords {
  lat: number;
  lng: number;
}

interface DataContextType {
  items: Item[];
  rentals: Rental[];
  reviews: Review[];
  messages: Message[];
  notifications: Notification[];
  userLocation: Coords | null;
  setUserLocation: (coords: Coords | null) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, data: Partial<Item>) => void;
  addRental: (rental: Rental) => void;
  updateRentalStatus: (id: string, status: RentalStatus) => void;
  completeRental: (rentalId: string) => Promise<void>;
  processRefund: (rentalId: string, amount: number) => Promise<boolean>;
  submitReview: (review: Omit<Review, 'id' | 'date' | 'isHidden'>) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, content: string) => void;
  markAsRead: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  deleteConversation: (userId: string, partnerId: string) => void;
  clearAllMessages: (userId: string) => void;
  getItemById: (id: string) => Item | undefined;
  getRentalsByUserId: (userId: string) => Rental[];
  getRentalsByOwnerId: (ownerId: string) => Rental[];
  getReviewByTransaction: (transactionId: string, reviewerId: string) => Review | undefined;
  searchItems: (query: string, category?: string, city?: string) => Item[];
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  deleteUserData: (userId: string) => void;
  addNotification: (userId: string, type: NotificationType, title: string, message: string, link: string, relatedId?: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: (userId: string) => void;
  checkItemAvailability: (itemId: string, startDate: string, endDate: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userLocation, setUserLocationState] = useState<Coords | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedItems, storedRentals, storedReviews, storedMessages, storedNotifications] = await Promise.all([
          get<Item[]>('app_items'),
          get<Rental[]>('app_rentals'),
          get<Review[]>('app_reviews'),
          get<Message[]>('app_messages'),
          get<Notification[]>('app_notifications')
        ]);

        if (storedItems) setItems(storedItems);
        if (storedRentals) setRentals(storedRentals);
        if (storedReviews) setReviews(storedReviews);
        if (storedMessages) setMessages(storedMessages);
        if (storedNotifications) setNotifications(storedNotifications);
        
        const savedLoc = sessionStorage.getItem('user_coords');
        if (savedLoc) setUserLocationState(JSON.parse(savedLoc));

        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);

  const setUserLocation = (coords: Coords | null) => {
    setUserLocationState(coords);
    if (coords) sessionStorage.setItem('user_coords', JSON.stringify(coords));
    else sessionStorage.removeItem('user_coords');
  };

  useEffect(() => { if (isLoaded) set('app_items', items); }, [items, isLoaded]);
  useEffect(() => { if (isLoaded) set('app_rentals', rentals); }, [rentals, isLoaded]);
  useEffect(() => { if (isLoaded) set('app_reviews', reviews); }, [reviews, isLoaded]);
  useEffect(() => { if (isLoaded) set('app_messages', messages); }, [messages, isLoaded]);
  useEffect(() => { if (isLoaded) set('app_notifications', notifications); }, [notifications, isLoaded]);

  const addNotification = (userId: string, type: NotificationType, title: string, message: string, link: string, relatedId?: string) => {
    const newNotif: Notification = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 9),
      userId,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const clearNotifications = (userId: string) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  };

  const addItem = (item: Item) => setItems(prev => [item, ...prev]);
  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId));
  
  const updateItem = (itemId: string, data: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...data } : item));
  };

  const addRental = (rental: Rental) => {
    setRentals(prev => [rental, ...prev]);
    addNotification(
      rental.ownerId,
      NotificationType.RENTAL_REQUEST,
      'Nova Solicitação!',
      `Você recebeu um pedido de aluguel para: ${rental.itemTitle}`,
      '/dashboard',
      rental.id
    );
  };
  
  const updateRentalStatus = (id: string, status: RentalStatus) => {
    const rentalToUpdate = rentals.find(r => r.id === id);
    if (rentalToUpdate) {
      setRentals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      
      addNotification(
        rentalToUpdate.renterId,
        NotificationType.RENTAL_UPDATE,
        'Status do Aluguel Atualizado',
        `Seu aluguel de "${rentalToUpdate.itemTitle}" agora está: ${status}`,
        '/dashboard',
        rentalToUpdate.id
      );

      // Não alteramos item.available para false permanentemente aqui, pois agora controlamos por datas no detalhe.
      // No entanto, para compatibilidade com a busca atual que filtra por item.available:
      if (status === RentalStatus.CANCELLED) {
        updateItem(rentalToUpdate.itemId, { available: true });
      }
    }
  };

  const checkItemAvailability = (itemId: string, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Consideramos apenas aluguéis que estão em estados que ocupam o item
    const conflictingRentals = rentals.filter(r => 
      r.itemId === itemId && 
      [RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.SHIPPED, RentalStatus.DELIVERED].includes(r.status)
    );

    return !conflictingRentals.some(r => {
      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);
      // Sobreposição de intervalos: (NovoInício <= ExistenteFim) E (NovoFim >= ExistenteInício)
      return start <= rEnd && end >= rStart;
    });
  };

  const deleteUserData = (userId: string) => {
    setItems(prev => prev.filter(i => i.ownerId !== userId));
    setRentals(prev => prev.filter(r => r.ownerId !== userId && r.renterId !== userId));
    setMessages(prev => prev.filter(m => m.senderId !== userId && m.receiverId !== userId));
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  };

  const completeRental = async (rentalId: string) => {
    updateRentalStatus(rentalId, RentalStatus.COMPLETED);
  };

  const processRefund = async (rentalId: string, amount: number) => true;

  const submitReview = async (reviewData: Omit<Review, 'id' | 'date' | 'isHidden'>) => {
    const newReview: Review = {
        ...reviewData,
        id: 'rev_' + Date.now(),
        date: new Date().toISOString(),
        isHidden: false
    };
    
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);

    if (newReview.itemId && newReview.role === 'RENTER') {
      const itemReviews = updatedReviews.filter(r => r.itemId === newReview.itemId);
      const avg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
      updateItem(newReview.itemId, { rating: Number(avg.toFixed(1)), reviewCount: itemReviews.length });
    }

    const currentUsers = await get<User[]>('app_users_db') || [];
    const targetUserId = newReview.reviewedId;
    const targetUser = currentUsers.find(u => u.id === targetUserId);

    if (targetUser) {
        const userReviews = updatedReviews.filter(r => r.reviewedId === targetUserId);
        const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
        
        const score = Math.min(100, Math.round(avgRating * 20));
        let level: TrustStats['level'] = 'NEUTRAL';
        if (score < 40) level = 'RISK';
        else if (score >= 70 && score < 90) level = 'TRUSTED';
        else if (score >= 90) level = 'SUPER';

        const updatedStats: TrustStats = {
            ...targetUser.trustStats!,
            score,
            level,
            completedTransactions: rentals.filter(r => (r.ownerId === targetUserId || r.renterId === targetUserId) && r.status === RentalStatus.COMPLETED).length
        };

        if (newReview.role === 'RENTER') {
            updatedStats.avgRatingAsOwner = Number(avgRating.toFixed(1));
            updatedStats.countRatingAsOwner = userReviews.length;
        } else {
            updatedStats.avgRatingAsRenter = Number(avgRating.toFixed(1));
            updatedStats.countRatingAsRenter = userReviews.length;
        }

        const updatedUsers = currentUsers.map(u => u.id === targetUserId ? { ...u, trustStats: updatedStats } : u);
        await set('app_users_db', updatedUsers);
    }
  };

  const sendMessage = (senderId: string, receiverId: string, content: string) => {
    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      senderId, receiverId, content,
      timestamp: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, newMessage]);
    
    addNotification(
      receiverId,
      NotificationType.MESSAGE,
      'Nova Mensagem',
      `Você recebeu uma mensagem no chat.`,
      `/chat?with=${senderId}`
    );
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const deleteConversation = (userId: string, partnerId: string) => {
    setMessages(prev => prev.filter(m => 
      !((m.senderId === userId && m.receiverId === partnerId) || 
        (m.senderId === partnerId && m.receiverId === userId))
    ));
  };

  const clearAllMessages = (userId: string) => {
    setMessages(prev => prev.filter(m => m.senderId !== userId && m.receiverId !== userId));
  };

  const getItemById = (id: string) => items.find(i => i.id === id);
  const getRentalsByUserId = (userId: string) => rentals.filter(r => r.renterId === userId);
  const getRentalsByOwnerId = (ownerId: string) => rentals.filter(r => r.ownerId === ownerId);
  const getReviewByTransaction = (transactionId: string, reviewerId: string) => 
    reviews.find(r => r.transactionId === transactionId && r.reviewerId === reviewerId);

  const searchItems = (query: string, category?: string, city?: string) => {
    let result = items.filter(item => {
      const isAvailable = item.available;
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      const matchesCity = city ? item.city.toLowerCase().includes(city.toLowerCase()) : true;
      return isAvailable && matchesQuery && matchesCategory && matchesCity;
    });

    if (userLocation) {
        result = result.map(item => {
            if (item.lat && item.lng) {
                return { ...item, distance: calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng) };
            }
            return item;
        }).sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
    }

    return result;
  };

  return (
    <DataContext.Provider value={{ 
      items, rentals, reviews, messages, notifications, userLocation, setUserLocation,
      addItem, removeItem, updateItem, addRental, updateRentalStatus, completeRental,
      processRefund, submitReview, sendMessage, markAsRead, deleteMessage, 
      deleteConversation, clearAllMessages, getItemById, getRentalsByUserId, 
      getRentalsByOwnerId, getReviewByTransaction, searchItems, calculateDistance: calculateDistanceKm,
      deleteUserData, addNotification, markNotificationAsRead, clearNotifications, checkItemAvailability
    }}>
      {children}
    </DataContext.Provider>
  );
};
