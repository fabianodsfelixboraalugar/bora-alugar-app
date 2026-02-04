
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { supabase, IS_PREVIEW } from '../lib/supabase';
import { aiService } from '../services/aiService';
import { Item, Rental, Review, RentalStatus, Message, User, Notification, NotificationType } from '../types';
import { MOCK_ITEMS, MOCK_REVIEWS } from '../mockData';

interface Coords { lat: number; lng: number; }

interface DataContextType {
  items: Item[];
  rentals: Rental[];
  reviews: Review[];
  messages: Message[];
  notifications: Notification[];
  userLocation: Coords | null;
  setUserLocation: (c: Coords | null) => void;
  addItem: (i: Item) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, d: Partial<Item>) => void;
  addRental: (r: Rental) => void;
  updateRentalStatus: (id: string, s: RentalStatus) => void;
  completeRental: (id: string) => Promise<void>;
  processRefund: (id: string, a: number) => Promise<boolean>;
  submitReview: (r: any) => Promise<void>;
  sendMessage: (s: string, r: string, c: string) => void;
  markAsRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  deleteConversation: (u: string, p: string) => void;
  clearAllMessages: (u: string) => void;
  getItemById: (id: string) => Item | undefined;
  getRentalsByUserId: (id: string) => Rental[];
  getRentalsByOwnerId: (id: string) => Rental[];
  getReviewByTransaction: (tid: string, rid: string) => Review | undefined;
  searchItems: (q: string, cat?: string, city?: string) => Item[];
  calculateDistance: (la1: number, lo1: number, la2: number, lo2: number) => number;
  deleteUserData: (uid: string) => void;
  addNotification: (uid: string, t: NotificationType, ti: string, m: string, l: string, rid?: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: (uid: string) => void;
  checkItemAvailability: (id: string, s: string, e: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userLocation, setUserLocationState] = useState<Coords | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (IS_PREVIEW) {
        const [si, sr, sv, sm, sn] = await Promise.all([
          get<Item[]>('app_items'), get<Rental[]>('app_rentals'), 
          get<Review[]>('app_reviews'), get<Message[]>('app_messages'), 
          get<Notification[]>('app_notifications')
        ]);
        if (si) setItems(si);
        if (sr) setRentals(sr);
        if (sv) setReviews(sv);
        if (sm) setMessages(sm);
        if (sn) setNotifications(sn);
      } else {
        // Carregamento real Supabase virá aqui
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => { if (isLoaded && IS_PREVIEW) set('app_items', items); }, [items, isLoaded]);
  useEffect(() => { if (isLoaded && IS_PREVIEW) set('app_rentals', rentals); }, [rentals, isLoaded]);
  useEffect(() => { if (isLoaded && IS_PREVIEW) set('app_reviews', reviews); }, [reviews, isLoaded]);
  useEffect(() => { if (isLoaded && IS_PREVIEW) set('app_messages', messages); }, [messages, isLoaded]);
  useEffect(() => { if (isLoaded && IS_PREVIEW) set('app_notifications', notifications); }, [notifications, isLoaded]);

  const addNotification = (userId: string, type: NotificationType, title: string, message: string, link: string, relatedId?: string) => {
    const n: Notification = { id: 'n_' + Date.now(), userId, type, title, message, link, read: false, createdAt: new Date().toISOString(), relatedId };
    setNotifications(prev => [n, ...prev]);
  };

  const addItem = (item: Item) => setItems(p => [item, ...p]);
  const removeItem = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: string, d: Partial<Item>) => setItems(p => p.map(i => i.id === id ? { ...i, ...d } : i));
  const addRental = (r: Rental) => {
    setRentals(p => [r, ...p]);
    addNotification(r.ownerId, NotificationType.RENTAL_REQUEST, 'Nova Solicitação!', `Pedido para: ${r.itemTitle}`, '/dashboard', r.id);
  };
  const updateRentalStatus = (id: string, status: RentalStatus) => {
    const r = rentals.find(x => x.id === id);
    if (r) {
      setRentals(p => p.map(x => x.id === id ? { ...x, status } : x));
      addNotification(r.renterId, NotificationType.RENTAL_UPDATE, 'Status Atualizado', `Seu aluguel de "${r.itemTitle}" está: ${status}`, '/dashboard', r.id);
    }
  };

  const searchItems = (query: string, cat?: string, city?: string) => {
    return items.filter(i => {
      const mq = i.title.toLowerCase().includes(query.toLowerCase());
      const mc = cat ? i.category === cat : true;
      const mci = city ? i.city.toLowerCase().includes(city.toLowerCase()) : true;
      return i.available && mq && mc && mci;
    });
  };

  const sendMessage = (senderId: string, receiverId: string, content: string) => {
    const m: Message = { id: 'm_' + Date.now(), senderId, receiverId, content, timestamp: new Date().toISOString(), read: false };
    setMessages(p => [...p, m]);
    addNotification(receiverId, NotificationType.MESSAGE, 'Nova Mensagem', 'Você recebeu uma mensagem no chat.', `/chat?with=${senderId}`);
  };

  return (
    <DataContext.Provider value={{
      items, rentals, reviews, messages, notifications, userLocation,
      setUserLocation: (c) => setUserLocationState(c),
      addItem, removeItem, updateItem, addRental, updateRentalStatus,
      completeRental: async (id) => updateRentalStatus(id, RentalStatus.COMPLETED),
      processRefund: async () => true,
      submitReview: async (r) => setReviews(p => [...p, { ...r, id: 'rev_'+Date.now(), date: new Date().toISOString() }]),
      sendMessage,
      markAsRead: (id) => setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m)),
      deleteMessage: (id) => setMessages(p => p.filter(m => m.id !== id)),
      deleteConversation: (u, p) => setMessages(prev => prev.filter(m => !((m.senderId === u && m.receiverId === p) || (m.senderId === p && m.receiverId === u)))),
      clearAllMessages: (u) => setMessages(p => p.filter(m => m.senderId !== u && m.receiverId !== u)),
      getItemById: (id) => items.find(i => i.id === id),
      getRentalsByUserId: (id) => rentals.filter(r => r.renterId === id),
      getRentalsByOwnerId: (id) => rentals.filter(r => r.ownerId === id),
      getReviewByTransaction: (tid, rid) => reviews.find(r => r.transactionId === tid && r.reviewerId === rid),
      searchItems,
      calculateDistance: (la1, lo1, la2, lo2) => {
        const R = 6371;
        const dLat = (la2 - la1) * Math.PI / 180;
        const dLon = (lo2 - lo1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      },
      deleteUserData: (uid) => {
        setItems(p => p.filter(i => i.ownerId !== uid));
        setRentals(p => p.filter(r => r.ownerId !== uid && r.renterId !== uid));
        setNotifications(p => p.filter(n => n.userId !== uid));
      },
      markNotificationAsRead: (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)),
      clearNotifications: (uid) => setNotifications(p => p.filter(n => n.userId !== uid)),
      checkItemAvailability: (id, s, e) => {
        const st = new Date(s), en = new Date(e);
        return !rentals.some(r => r.itemId === id && [RentalStatus.ACTIVE, RentalStatus.CONFIRMED].includes(r.status) && st <= new Date(r.endDate) && en >= new Date(r.startDate));
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Hook customizado para usar o DataContext
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};
