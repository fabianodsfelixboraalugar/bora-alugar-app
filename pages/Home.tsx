
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
                      model: "gemini-3-flash-preview",
                      contents: "Retorne APENAS o nome da cidade desta localização geográfica (lat: " + latitude + ", lng: " + longitude + ").",
                      config: { thinkingConfig: { thinkingBudget: 0 } },
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

  const categoryIcons: Record<string, string> = {
    [Category.TOOLS]: 'fa-tools',
    [Category.REAL_ESTATE]: 'fa-home',
    [Category.GAMES]: 'fa-gamepad',
    [Category.CAMPING]: 'fa-campground',
    [Category.ELECTRONICS]: 'fa-laptop',
    [Category.VEHICLES]: 'fa-car',
    [Category.PARTY]: 'fa-glass-cheers',
    [Category.APPLIANCES]: 'fa-blender',
    [Category.OTHER]: 'fa-box'
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative bg-[#1a2e21] pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8 animate-fadeIn leading-tight">
            Alugue o que precisar,<br/><span className="text-brand-500">ganhe com o que tem.</span>
          </h1>
          
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${searchTerm}`); }} className="max-w-3xl mx-auto bg-white p-2 rounded-[3rem] shadow-2xl flex items-center relative z-20 mb-12 border-4 border-white/20 backdrop-blur-sm">
            <div className="pl-8 text-gray-300"><i className="fas fa-search text-xl"></i></div>
            <input 
              type="text" 
              placeholder="O que você está procurando hoje?" 
              className="w-full px-6 py-5 text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none text-lg font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit" className="bg-[#58B83F] hover:bg-brand-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest transition duration-200 shadow-xl active:scale-95">Buscar</button>
          </form>

          {locationStatus === 'success' && currentCity && (
             <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-2.5 rounded-full border border-white/20 animate-fadeIn backdrop-blur-md">
                <i className="fas fa-map-marker-alt text-brand-500"></i> 
                <span className="text-sm font-bold text-white uppercase tracking-widest">Catálogo em {currentCity}</span>
             </div>
          )}
        </div>
      </section>

      {/* Categorias Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-black text-gray-900 mb-10 flex items-center gap-3 uppercase tracking-widest"><span className="w-12 h-1.5 bg-brand-500 rounded-full"></span>Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
          {Object.values(Category).map((cat) => (
            <button 
              key={cat} 
              onClick={() => navigate(`/search?category=${cat}`)} 
              className="flex flex-col items-center p-6 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-105 transition-all border border-gray-100 group"
            >
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-4 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                <i className={`fas ${categoryIcons[cat] || 'fa-box'} text-2xl`}></i>
              </div>
              <span className="text-[10px] font-black text-gray-600 text-center uppercase tracking-tighter leading-tight">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="py-20 bg-white rounded-t-[5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{userLocation ? 'Ofertas na sua região' : 'Destaques do Dia'}</h2>
            <button onClick={() => navigate('/search')} className="text-brand-600 font-black text-xs uppercase tracking-widest hover:underline">Ver tudo <i className="fas fa-arrow-right ml-1"></i></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {isDataLoading ? (
                  Array(8).fill(0).map((_, i) => <ItemSkeleton key={i} />)
              ) : (
                  displayedItems.map(item => <ItemCard key={item.id} item={item} />)
              )}
          </div>
          {!isDataLoading && displayedItems.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
               <i className="fas fa-search-location text-gray-200 text-5xl mb-4"></i>
               <p className="text-gray-400 font-bold uppercase text-sm">Nenhum item encontrado nesta região.</p>
               <button onClick={() => setSearchRadius(500)} className="mt-4 text-brand-600 font-black text-xs uppercase underline">Aumentar Raio de Busca</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
