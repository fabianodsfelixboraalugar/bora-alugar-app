
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Item, Rental, Review, Message, Notification, NotificationType, RentalStatus, AppLog } from '../types';

interface DataContextType {
  items: Item[];
  rentals: Rental[];
  messages: Message[];
  notifications: Notification[];
  reviews: Review[];
  logs: AppLog[];
  userLocation: { lat: number, lng: number } | null;
  isLoading: boolean;
  setUserLocation: (loc: { lat: number, lng: number } | null) => void;
  addItem: (item: any) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
  addRental: (rental: any) => Promise<void>;
  updateRentalStatus: (id: string, status: RentalStatus) => Promise<void>;
  getRentalsByUserId: (userId: string) => Rental[];
  getRentalsByOwnerId: (ownerId: string) => Rental[];
  checkItemAvailability: (itemId: string, startDate: string, endDate: string) => boolean;
  sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteConversation: (userId: string, partnerId: string) => Promise<void>;
  clearAllMessages: (userId: string) => Promise<void>;
  addNotification: (userId: string, type: NotificationType, title: string, message: string, link: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
  submitReview: (review: any) => Promise<void>;
  getReviewByTransaction: (transactionId: string, reviewerId: string) => Review | undefined;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  deleteUserData: (userId: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [
        { data: itemsData },
        { data: rentalsData },
        { data: messagesData },
        { data: notificationsData },
        { data: reviewsData }
      ] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('rentals').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('timestamp', { ascending: true }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('date', { ascending: false })
      ]);

      setItems((itemsData as any) || []);
      setRentals((rentalsData as any) || []);
      setMessages((messagesData as any) || []);
      setNotifications((notificationsData as any) || []);
      setReviews((reviewsData as any) || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const base64ToBlob = (base64: string) => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const addItem = async (itemData: any) => {
    const uploadedImages = [];
    for (const [index, base64] of itemData.images.entries()) {
      if (base64.startsWith('data:')) {
        const blob = base64ToBlob(base64);
        const fileName = `item_${Date.now()}_${index}.png`;
        const { error: uploadError } = await supabase.storage.from('item-images').upload(fileName, blob);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(fileName);
        uploadedImages.push(publicUrl);
      } else {
        uploadedImages.push(base64);
      }
    }

    const { error } = await supabase.from('items').insert([{
      ...itemData,
      images: uploadedImages,
      pricePerDay: itemData.pricePerDay 
    }]);

    if (error) throw error;
    await fetchData();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('items').delete().eq('id', itemId);
    await fetchData();
  };

  const updateItem = async (itemId: string, data: Partial<Item>) => {
    await supabase.from('items').update(data).eq('id', itemId);
    await fetchData();
  };

  const getItemById = (id: string) => items.find(i => i.id === id);

  const addRental = async (rentalData: any) => {
    const { error } = await supabase.from('rentals').insert([rentalData]);
    if (error) throw error;
    await addNotification(rentalData.ownerId, NotificationType.RENTAL_REQUEST, 'Novo Aluguel!', `Pedido para: ${rentalData.itemTitle}`, '/dashboard');
    await fetchData();
  };

  const updateRentalStatus = async (id: string, status: RentalStatus) => {
    await supabase.from('rentals').update({ status }).eq('id', id);
    await fetchData();
  };

  const getRentalsByUserId = (userId: string) => rentals.filter(r => r.renterId === userId);
  const getRentalsByOwnerId = (ownerId: string) => rentals.filter(r => r.ownerId === ownerId);

  const checkItemAvailability = (itemId: string, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return !rentals.some(r => 
      r.itemId === itemId && 
      r.status !== RentalStatus.CANCELLED &&
      ((start >= new Date(r.startDate) && start <= new Date(r.endDate)) ||
       (end >= new Date(r.startDate) && end <= new Date(r.endDate)))
    );
  };

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    await supabase.from('messages').insert([{ senderId, receiverId, content, read: false }]);
    await fetchData();
  };

  const markAsRead = async (messageId: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
    await fetchData();
  };

  const deleteMessage = async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId);
    await fetchData();
  };

  const deleteConversation = async (userId: string, partnerId: string) => {
    await supabase.from('messages').delete()
      .or(`and(senderId.eq.${userId},receiverId.eq.${partnerId}),and(senderId.eq.${partnerId},receiverId.eq.${userId})`);
    await fetchData();
  };

  const clearAllMessages = async (userId: string) => {
    await supabase.from('messages').delete().or(`senderId.eq.${userId},receiverId.eq.${userId}`);
    await fetchData();
  };

  const addNotification = async (userId: string, type: NotificationType, title: string, message: string, link: string) => {
    await supabase.from('notifications').insert([{ userId, type, title, message, link, read: false }]);
    await fetchData();
  };

  const markNotificationAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await fetchData();
  };

  const clearNotifications = async (userId: string) => {
    await supabase.from('notifications').delete().eq('userId', userId);
    await fetchData();
  };

  const submitReview = async (review: any) => {
    await supabase.from('reviews').insert([review]);
    await fetchData();
  };

  const getReviewByTransaction = (transactionId: string, reviewerId: string) => 
    reviews.find(r => r.transactionId === transactionId && r.reviewerId === reviewerId);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const deleteUserData = async (userId: string) => {
    await Promise.all([
      supabase.from('items').delete().eq('ownerId', userId),
      supabase.from('rentals').delete().or(`renterId.eq.${userId},ownerId.eq.${userId}`),
      supabase.from('messages').delete().or(`senderId.eq.${userId},receiverId.eq.${userId}`),
      supabase.from('notifications').delete().eq('userId', userId)
    ]);
    await fetchData();
  };

  const clearLogs = async () => {
    await supabase.from('logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await fetchData();
  };

  return (
    <DataContext.Provider value={{ 
      items, rentals, messages, notifications, reviews, logs, userLocation, isLoading, 
      setUserLocation, addItem, removeItem, updateItem, getItemById, addRental, updateRentalStatus, 
      getRentalsByUserId, getRentalsByOwnerId, checkItemAvailability, sendMessage, markAsRead, 
      deleteMessage, deleteConversation, clearAllMessages, addNotification, markNotificationAsRead, 
      clearNotifications, submitReview, getReviewByTransaction, calculateDistance, deleteUserData, clearLogs
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
