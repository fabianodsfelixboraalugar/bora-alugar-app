
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, Rental, Review, Message, Notification, AppLog, RentalStatus, NotificationType } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  items: Item[];
  rentals: Rental[];
  messages: Message[];
  notifications: Notification[];
  logs: AppLog[];
  addItem: (item: any) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addRental: (rental: any) => Promise<void>;
  updateRentalStatus: (id: string, status: RentalStatus) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
  addLog: (action: string, details: string, userId?: string, userEmail?: string) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
  getRentalsByUserId: (userId: string) => Rental[];
  searchItems: (query: string, category?: string, city?: string) => Item[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const [
      { data: itemsData },
      { data: rentalsData },
      { data: logsData }
    ] = await Promise.all([
      supabase.from('items').select('*'),
      supabase.from('rentals').select('*'),
      supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50)
    ]);

    if (itemsData) setItems(itemsData as Item[]);
    if (rentalsData) setRentals(rentalsData as Rental[]);
    if (logsData) setLogs(logsData as AppLog[]);
  };

  const addItem = async (item: any) => {
    const { data, error } = await supabase.from('items').insert([item]).select();
    if (data) setItems(prev => [data[0] as Item, ...prev]);
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (!error) setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const addRental = async (rental: any) => {
    const { data, error } = await supabase.from('rentals').insert([rental]).select();
    if (data) setRentals(prev => [data[0] as Rental, ...prev]);
  };

  const updateRentalStatus = async (id: string, status: RentalStatus) => {
    const { error } = await supabase.from('rentals').update({ status }).eq('id', id);
    if (!error) setRentals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    const newMessage = { sender_id: senderId, receiver_id: receiverId, content, timestamp: new Date().toISOString() };
    const { data, error } = await supabase.from('messages').insert([newMessage]).select();
    if (data) setMessages(prev => [...prev, data[0] as Message]);
  };

  const addLog = async (action: string, details: string, userId?: string, userEmail?: string) => {
    const log = { action, details, user_id: userId, user_email: userEmail, timestamp: new Date().toISOString() };
    await supabase.from('logs').insert([log]);
    // Atualização otimista
    setLogs(prev => [log as any, ...prev].slice(0, 50));
  };

  const getItemById = (id: string) => items.find(i => i.id === id);
  const getRentalsByUserId = (userId: string) => rentals.filter(r => r.renterId === userId);

  const searchItems = (query: string, category?: string, city?: string) => {
    return items.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      const matchesCity = city ? item.city.toLowerCase().includes(city.toLowerCase()) : true;
      return item.available && matchesQuery && matchesCategory && matchesCity;
    });
  };

  return (
    <DataContext.Provider value={{ 
      items, rentals, messages, notifications, logs,
      addItem, removeItem, addRental, updateRentalStatus, sendMessage, addLog,
      getItemById, getRentalsByUserId, searchItems
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
