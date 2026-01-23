
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  const [networkError, setNetworkError] = useState(false);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const [
        { data: itemsRaw, error: itemsError },
        { data: rentalsRaw, error: rentalsError },
        { data: messagesRaw, error: messagesError },
        { data: notificationsRaw, error: notificationsError },
        { data: reviewsRaw, error: reviewsError }
      ] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('rentals').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('timestamp', { ascending: true }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('date', { ascending: false })
      ]);

      if (itemsError || rentalsError || messagesError || notificationsError || reviewsError) {
        console.warn("Alguns dados não puderam ser carregados do Supabase.", { itemsError, rentalsError });
      }

      // Mapeamento de snake_case para camelCase para o App não quebrar
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

      setMessages((messagesRaw?.map((m: any) => ({
        ...m,
        senderId: m.sender_id,
        receiverId: m.receiver_id
      })) as Message[]) || []);

      setNotifications((notificationsRaw?.map((n: any) => ({
        ...n,
        userId: n.user_id,
        createdAt: n.created_at
      })) as Notification[]) || []);

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
      console.error("Erro fatal na conexão com Supabase:", error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        setNetworkError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (isSupabaseConfigured) {
      const channel = supabase.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
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

    const dbItem = {
      id: itemData.id,
      owner_id: itemData.ownerId,
      owner_name: itemData.ownerName,
      title: itemData.title,
      category: itemData.category,
      description: itemData.description,
      contract_terms: itemData.contractTerms,
      images: uploadedImages,
      video_url: itemData.videoUrl,
      price_per_day: itemData.pricePerDay,
      city: itemData.city,
      state: itemData.state,
      available: true,
      status: 'Disponível',
      delivery_config: itemData.deliveryConfig
    };

    const { error } = await supabase.from('items').insert([dbItem]);
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
    if (data.pricePerDay) dbData.price_per_day = data.pricePerDay;

    await supabase.from('items').update(dbData).eq('id', itemId);
    await fetchData();
  };

  const getItemById = (id: string) => items.find(i => i.id === id);

  const addRental = async (rentalData: any) => {
    const dbRental = {
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
    };

    const { error } = await supabase.from('rentals').insert([dbRental]);
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
    await supabase.from('messages').insert([{ 
      sender_id: senderId, 
      receiver_id: receiverId, 
      content, 
      read: false 
    }]);
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
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`);
    await fetchData();
  };

  const clearAllMessages = async (userId: string) => {
    await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    await fetchData();
  };

  const addNotification = async (userId: string, type: NotificationType, title: string, message: string, link: string) => {
    await supabase.from('notifications').insert([{ 
      user_id: userId, 
      type, 
      title, 
      message, 
      link, 
      read: false 
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
    const dbReview = {
      id: review.id || 'rev_' + Date.now(),
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
    };
    await supabase.from('reviews').insert([dbReview]);
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
      supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase.from('notifications').delete().eq('user_id', userId)
    ]);
    await fetchData();
  };

  const clearLogs = async () => {
    await fetchData();
  };

  return (
    <DataContext.Provider value={{ 
      items, rentals, messages, notifications, reviews, logs, userLocation, isLoading, networkError,
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
