
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { Item, Rental, Review, RentalStatus, Message, Notification, NotificationType, AppLog } from '../types';
import { MOCK_ITEMS, MOCK_REVIEWS } from '../mockData';

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
  logs: AppLog[];
  isLoading: boolean;
  userLocation: Coords | null;
  setUserLocation: (coords: Coords | null) => void;
  addItem: (item: Item) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
  addRental: (rental: Rental) => Promise<void>;
  updateRentalStatus: (id: string, status: RentalStatus) => Promise<void>;
  submitReview: (review: Omit<Review, 'id' | 'date' | 'isHidden'>) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteConversation: (userId: string, partnerId: string) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
  getRentalsByUserId: (userId: string) => Rental[];
  getRentalsByOwnerId: (ownerId: string) => Rental[];
  getReviewByTransaction: (transactionId: string, reviewerId: string) => Review | undefined;
  searchItems: (query: string, category?: string, city?: string) => Item[];
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  addNotification: (userId: string, type: NotificationType, title: string, message: string, link: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
  checkItemAvailability: (itemId: string, startDate: string, endDate: string) => boolean;
  addLog: (action: string, details: string, userId?: string, userEmail?: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearAllMessages: (userId: string) => Promise<void>;
  deleteUserData: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [userLocation, setUserLocationState] = useState<Coords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userIp, setUserIp] = useState<string>('0.0.0.0');

  const simulateNetwork = () => new Promise(resolve => setTimeout(resolve, 600));

  useEffect(() => {
    const initData = async () => {
      try {
        const [storedItems, storedRentals, storedReviews, storedMessages, storedNotifications, storedLogs] = await Promise.all([
          get('app_items'),
          get('app_rentals'),
          get('app_reviews'),
          get('app_messages'),
          get('app_notifications'),
          get('app_audit_logs')
        ]);

        setItems(storedItems || MOCK_ITEMS);
        setRentals(storedRentals || []);
        setReviews(storedReviews || MOCK_REVIEWS);
        setMessages(storedMessages || []);
        setNotifications(storedNotifications || []);
        setLogs(storedLogs || []);
        
        const savedLoc = sessionStorage.getItem('user_coords');
        if (savedLoc) setUserLocationState(JSON.parse(savedLoc));

        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          setUserIp(data.ip);
        } catch (e) { console.warn("IP Fallback"); }

      } catch (err) {
        console.error("Local DB Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const addLog = async (action: string, details: string, userId?: string, userEmail?: string) => {
    const newLog: AppLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action, details, userId, userEmail, ip: userIp
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    await set('app_audit_logs', updated);
  };

  const clearLogs = async () => {
    setLogs([]);
    await set('app_audit_logs', []);
  };

  const addItem = async (item: Item) => {
    await simulateNetwork();
    const updated = [item, ...items];
    setItems(updated);
    await set('app_items', updated);
    await addLog('CRIAÇÃO_ANÚNCIO', `Anúncio: ${item.title}`, item.ownerId, item.ownerName);
  };

  const removeItem = async (itemId: string) => {
    const updated = items.filter(i => i.id !== itemId);
    setItems(updated);
    await set('app_items', updated);
  };

  const updateItem = async (itemId: string, data: Partial<Item>) => {
    const updated = items.map(item => item.id === itemId ? { ...item, ...data } : item);
    setItems(updated);
    await set('app_items', updated);
  };

  const addNotification = async (userId: string, type: NotificationType, title: string, message: string, link: string) => {
    const newNotif: Notification = {
      id: 'notif_' + Date.now(),
      userId, type, title, message, link, read: false, createdAt: new Date().toISOString()
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await set('app_notifications', updated);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    setNotifications(updated);
    await set('app_notifications', updated);
  };

  const clearNotifications = async (userId: string) => {
    const updated = notifications.filter(n => n.userId !== userId);
    setNotifications(updated);
    await set('app_notifications', updated);
  };

  const addRental = async (rental: Rental) => {
    await simulateNetwork();
    const updated = [rental, ...rentals];
    setRentals(updated);
    await set('app_rentals', updated);
    await addNotification(rental.ownerId, NotificationType.RENTAL_REQUEST, 'Novo Aluguel!', `Pedido para: ${rental.itemTitle}`, '/dashboard');
  };

  const updateRentalStatus = async (id: string, status: RentalStatus) => {
    const updated = rentals.map(r => r.id === id ? { ...r, status } : r);
    setRentals(updated);
    await set('app_rentals', updated);
    const r = rentals.find(rent => rent.id === id);
    if (r) await addNotification(r.renterId, NotificationType.RENTAL_UPDATE, 'Status Alterado', `Seu aluguel está: ${status}`, '/dashboard');
  };

  const submitReview = async (reviewData: Omit<Review, 'id' | 'date' | 'isHidden'>) => {
    await simulateNetwork();
    const newReview: Review = { ...reviewData, id: 'rev_' + Date.now(), date: new Date().toISOString(), isHidden: false };
    const updated = [...reviews, newReview];
    setReviews(updated);
    await set('app_reviews', updated);
  };

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    const newMessage: Message = { id: 'msg_' + Date.now(), senderId, receiverId, content, timestamp: new Date().toISOString(), read: false };
    const updated = [...messages, newMessage];
    setMessages(updated);
    await set('app_messages', updated);
  };

  const markAsRead = async (messageId: string) => {
    const updated = messages.map(m => m.id === messageId ? { ...m, read: true } : m);
    setMessages(updated);
    await set('app_messages', updated);
  };

  const deleteConversation = async (userId: string, partnerId: string) => {
    const updated = messages.filter(m => !((m.senderId === userId && m.receiverId === partnerId) || (m.senderId === partnerId && m.receiverId === userId)));
    setMessages(updated);
    await set('app_messages', updated);
  };

  const deleteMessage = async (messageId: string) => {
    const updated = messages.filter(m => m.id !== messageId);
    setMessages(updated);
    await set('app_messages', updated);
  };

  const clearAllMessages = async (userId: string) => {
    const updated = messages.filter(m => m.senderId !== userId && m.receiverId !== userId);
    setMessages(updated);
    await set('app_messages', updated);
  };

  const deleteUserData = async (userId: string) => {
    const updatedItems = items.filter(i => i.ownerId !== userId);
    setItems(updatedItems);
    await set('app_items', updatedItems);

    const updatedRentals = rentals.filter(r => r.renterId !== userId && r.ownerId !== userId);
    setRentals(updatedRentals);
    await set('app_rentals', updatedRentals);

    const updatedNotifs = notifications.filter(n => n.userId !== userId);
    setNotifications(updatedNotifs);
    await set('app_notifications', updatedNotifs);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const checkItemAvailability = (itemId: string, start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return !rentals.some(r => r.itemId === itemId && [RentalStatus.CONFIRMED, RentalStatus.ACTIVE].includes(r.status) && s <= new Date(r.endDate) && e >= new Date(r.startDate));
  };

  return (
    <DataContext.Provider value={{ 
      items, rentals, reviews, messages, notifications, logs, isLoading, userLocation,
      setUserLocation: (c) => { setUserLocationState(c); if(c) sessionStorage.setItem('user_coords', JSON.stringify(c)); },
      addItem, removeItem, updateItem, addRental, updateRentalStatus, submitReview, 
      sendMessage, markAsRead, deleteConversation, deleteMessage, clearAllMessages, deleteUserData,
      getItemById: (id) => items.find(i => i.id === id),
      getRentalsByUserId: (u) => rentals.filter(r => r.renterId === u),
      getRentalsByOwnerId: (o) => rentals.filter(r => r.ownerId === o),
      getReviewByTransaction: (t, r) => reviews.find(rev => rev.transactionId === t && rev.reviewerId === r),
      searchItems: (q, cat, city) => items.filter(i => i.available && i.title.toLowerCase().includes(q.toLowerCase()) && (!cat || i.category === cat) && (!city || i.city.toLowerCase().includes(city.toLowerCase()))),
      calculateDistance, addNotification, markNotificationAsRead, clearNotifications, checkItemAvailability, addLog, clearLogs
    }}>
      {children}
    </DataContext.Provider>
  );
};
