
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Item, Rental, Review, Message, Notification, NotificationType, RentalStatus, AppLog, Category, ItemStatus } from '../types';

interface DataContextType {
  items: Item[];
  rentals: Rental[];
  messages: Message[];
  notifications: Notification[];
  reviews: Review[];
  logs: AppLog[];
  userLocation: { lat: number, lng: number } | null;
  isLoading: boolean;
  networkError: boolean;
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
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const fetchData = useCallback(async () => {
    // Se não houver usuário, limpamos estados privados mas mantemos itens públicos
    if (!user) {
      setRentals([]);
      setMessages([]);
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const [
        { data: itemsRaw },
        { data: rentalsRaw },
        { data: notificationsRaw },
        { data: messagesRaw },
        { data: reviewsRaw }
      ] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('rentals').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('timestamp', { ascending: true }),
        supabase.from('reviews').select('*').order('date', { ascending: false })
      ]);

      setItems((itemsRaw?.map((i: any) => ({
        ...i,
        ownerId: i.owner_id,
        ownerName: i.owner_name,
        contractTerms: i.contract_terms,
        videoUrl: i.video_url,
        pricePerDay: i.price_per_day,
        createdAt: i.created_at,
        reviewCount: i.review_count,
        deliveryConfig: i.delivery_config
      })) as Item[]) || []);

      setRentals((rentalsRaw?.map((r: any) => ({
        ...r,
        itemId: r.item_id,
        itemTitle: r.item_title,
        itemImage: r.item_image,
        renterId: r.renter_id,
        ownerId: r.owner_id,
        startDate: r.start_date,
        endDate: r.end_date,
        totalPrice: r.total_price,
        createdAt: r.created_at,
        deliveryInfo: r.delivery_info,
        contractAccepted: r.contract_accepted
      })) as Rental[]) || []);

      setNotifications((notificationsRaw?.map((n: any) => ({
        ...n,
        userId: n.user_id,
        createdAt: n.created_at
      })) as Notification[]) || []);

      setMessages((messagesRaw?.map((m: any) => ({
        ...m,
        senderId: m.sender_id,
        receiverId: m.receiver_id
      })) as Message[]) || []);

      setReviews((reviewsRaw?.map((rv: any) => ({
        ...rv,
        transactionId: rv.transaction_id,
        itemId: rv.item_id,
        reviewerId: rv.reviewer_id,
        reviewedId: rv.reviewed_id,
        reviewerName: rv.reviewer_name,
        isAnonymous: rv.is_anonymous
      })) as Review[]) || []);

      setNetworkError(false);
    } catch (error: any) {
      console.error("Erro ao sincronizar dados:", error);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Busca inicial de itens públicos (independente de login)
  const fetchPublicItems = async () => {
    try {
      const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
      if (data) {
        setItems(data.map((i: any) => ({
          ...i,
          ownerId: i.owner_id,
          ownerName: i.owner_name,
          pricePerDay: i.price_per_day,
          deliveryConfig: i.delivery_config
        })) as Item[]);
      }
    } catch (e) {
      console.error("Erro ao carregar itens públicos:", e);
    }
  };

  useEffect(() => {
    fetchPublicItems();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const channel = supabase.channel(`user-data-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchData]);

  const addItem = async (itemData: any) => {
    const { error } = await supabase.from('items').insert([{
      id: itemData.id,
      owner_id: itemData.ownerId,
      owner_name: itemData.ownerName,
      title: itemData.title,
      category: itemData.category,
      description: itemData.description,
      contract_terms: itemData.contractTerms,
      images: itemData.images,
      video_url: itemData.videoUrl,
      price_per_day: itemData.pricePerDay,
      city: itemData.city,
      state: itemData.state,
      available: true,
      status: 'Disponível',
      delivery_config: itemData.deliveryConfig
    }]);
    if (error) throw error;
    await fetchData();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('items').delete().eq('id', itemId);
    await fetchData();
  };

  const updateItem = async (itemId: string, data: Partial<Item>) => {
    const dbData: any = {};
    if (data.title) dbData.title = data.title;
    if (data.available !== undefined) dbData.available = data.available;
    if (data.status) dbData.status = data.status;
    await supabase.from('items').update(dbData).eq('id', itemId);
    await fetchData();
  };

  const getItemById = (id: string) => items.find(i => i.id === id);

  const addRental = async (rentalData: any) => {
    const { error } = await supabase.from('rentals').insert([{
      id: rentalData.id,
      item_id: rentalData.itemId,
      item_title: rentalData.itemTitle,
      item_image: rentalData.itemImage,
      renter_id: rentalData.renterId,
      owner_id: rentalData.ownerId,
      start_date: rentalData.startDate,
      end_date: rentalData.endDate,
      total_price: rentalData.totalPrice,
      status: rentalData.status,
      delivery_info: rentalData.deliveryInfo,
      contract_accepted: rentalData.contractAccepted
    }]);
    if (error) throw error;
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
    await supabase.from('messages').insert([{
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      read: false
    }]);
    await fetchData();
  };

  const markAsRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id);
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
  };

  const deleteConversation = async (u1: string, u2: string) => {
    await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`);
    await fetchData();
  };

  const clearAllMessages = async (uid: string) => {
    await supabase.from('messages').delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
    await fetchData();
  };

  const addNotification = async (userId: string, type: NotificationType, title: string, message: string, link: string) => {
    await supabase.from('notifications').insert([{ 
      user_id: userId, type, title, message, link, read: false 
    }]);
    await fetchData();
  };

  const markNotificationAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await fetchData();
  };

  const clearNotifications = async (userId: string) => {
    await supabase.from('notifications').delete().eq('user_id', userId);
    await fetchData();
  };

  const submitReview = async (review: any) => {
    await supabase.from('reviews').insert([{
      transaction_id: review.transactionId,
      item_id: review.itemId,
      reviewer_id: review.reviewerId,
      reviewed_id: review.reviewedId,
      reviewer_name: review.reviewerName,
      role: review.role,
      rating: review.rating,
      comment: review.comment,
      is_anonymous: review.isAnonymous,
      criteria: review.criteria,
      tags: review.tags
    }]);
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
      supabase.from('items').delete().eq('owner_id', userId),
      supabase.from('rentals').delete().or(`renter_id.eq.${userId},owner_id.eq.${userId}`),
      supabase.from('profiles').delete().eq('id', userId)
    ]);
    await fetchData();
  };

  const clearLogs = async () => {};

  return (
    <DataContext.Provider value={{ 
      items, rentals, messages, notifications, reviews, logs, userLocation, isLoading, networkError,
      setUserLocation, addItem, removeItem, updateItem, getItemById, addRental, updateRentalStatus, 
      getRentalsByUserId, getRentalsByOwnerId, checkItemAvailability, sendMessage, markAsRead, 
      deleteMessage, deleteConversation, clearAllMessages, addNotification, markNotificationAsRead, 
      clearNotifications, submitReview, getReviewByTransaction, calculateDistance, deleteUserData, clearLogs,
      refreshData: fetchData
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
