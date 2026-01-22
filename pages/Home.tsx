
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ItemCard } from '../components/ItemCard';
import { ItemSkeleton } from '../components/ItemSkeleton';
import { Category } from '../types';

export const Home: React.FC = () => {
  const { items, userLocation, setUserLocation, calculateDistance, isLoading: isDataLoading } = useData();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'loading' | 'success' | 'denied' | 'error'>('prompt');
  const [currentCity, setCurrentCity] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(50);

  useEffect(() => {
    if (!isAuthenticated && !userLocation) return;
    if (userLocation) { setLocationStatus('success'); return; }

    const requestLocation = () => {
      if (!('geolocation' in navigator)) { setLocationStatus('error'); return; }
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationStatus('success');
          
          if (process.env.API_KEY) {
              try {
                  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                  const response = await ai.models.generateContent({
                      model: "gemini-2.5-flash",
                      contents: "Retorne APENAS o nome da cidade desta localização.",
                      config: { tools: [{ googleMaps: {} }], toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } } },
                  });
                  const city = response.text?.trim().replace(/\.$/, '');
                  if (city) setCurrentCity(city);
              } catch (err) { console.error(err); }
          }
        },
        () => setLocationStatus('denied'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };
    requestLocation();
  }, [isAuthenticated, setUserLocation, userLocation]);

  const displayedItems = useMemo(() => {
    let processedItems = [...items];
    if (userLocation) {
        processedItems = processedItems
            .map(item => ({ ...item, distance: item.lat && item.lng ? calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng) : 9999 }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .filter(item => item.distance <= searchRadius);
    } else {
        processedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return processedItems.slice(0, 8);
  }, [items, userLocation, searchRadius, calculateDistance]);

  const categories = Object.values(Category);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-brand-900 pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 animate-fadeIn">
            Alugue o que precisar,<br className="hidden md:block"/> ganhe com o que tem.
          </h1>
          
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${searchTerm}`); }} className="max-w-2xl mx-auto bg-white p-2 rounded-full shadow-2xl flex items-center relative z-20 mb-12">
            <div className="pl-6 text-gray-400"><i className="fas fa-search text-lg"></i></div>
            <input type="text" placeholder="O que você está procurando hoje?" className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit" className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-full font-bold transition duration-200 shadow-lg">Buscar</button>
          </form>

          <div className="mt-6 flex flex-col items-center min-h-[40px]">
            {locationStatus === 'loading' && (
               <div className="flex items-center gap-3 text-brand-100 bg-brand-800/40 px-6 py-2.5 rounded-full backdrop-blur-md border border-white/10">
                  <i className="fas fa-circle-notch fa-spin"></i> 
                  <span className="text-sm font-medium">Sincronizando banco de dados regional...</span>
               </div>
            )}
            {locationStatus === 'success' && currentCity && (
               <div className="text-brand-100 text-xs font-bold flex items-center gap-2 bg-green-900/30 px-5 py-2 rounded-full border border-green-500/30 animate-fadeIn">
                  <i className="fas fa-map-marker-alt text-green-400"></i> Catálogo online em <span className="text-white">{currentCity}</span>
               </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3"><span className="w-8 h-1 bg-brand-600 rounded-full"></span>Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          {categories.map((cat, idx) => (
            <button key={idx} onClick={() => navigate(`/search?category=${cat}`)} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:border-brand-200 transition border border-gray-100 group">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-3 group-hover:bg-brand-600 group-hover:text-white transition-all"><i className={`fas fa-box`}></i></div>
              <span className="text-xs font-bold text-gray-700 text-center uppercase tracking-tight">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">{userLocation ? 'Ofertas na sua região' : 'Destaques do Dia'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isDataLoading ? (
                  Array(8).fill(0).map((_, i) => <ItemSkeleton key={i} />)
              ) : (
                  displayedItems.map(item => <ItemCard key={item.id} item={item} />)
              )}
          </div>
        </div>
      </section>
    </div>
  );
};
