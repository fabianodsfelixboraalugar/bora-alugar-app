
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ItemCard } from '../components/ItemCard';
import { ItemSkeleton } from '../components/ItemSkeleton';
import { Category } from '../types';

export const Home: React.FC = () => {
  const { items, userLocation, setUserLocation, calculateDistance } = useData();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'loading' | 'success' | 'denied' | 'error'>('prompt');
  const [currentCity, setCurrentCity] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);
  const [fallbackZipCode, setFallbackZipCode] = useState('');
  const [isSearchingZip, setIsSearchingZip] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !userLocation) {
        setLocationStatus('prompt');
        return;
    }

    const requestLocation = () => {
      if (!('geolocation' in navigator)) {
          setLocationStatus('error');
          return;
      }

      if (userLocation) {
        setLocationStatus('success');
        return;
      }

      setLocationStatus('loading');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationStatus('success');
          
          const city = await aiService.resolveCityFromCoords(latitude, longitude);
          if (city) setCurrentCity(city);
        },
        (error) => {
          console.warn("Localização negada:", error);
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    requestLocation();
  }, [isAuthenticated, setUserLocation, userLocation]);

  const handleZipFallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackZipCode.length < 8) return;
    
    setIsSearchingZip(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${fallbackZipCode.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setCurrentCity(data.localidade);
        setLocationStatus('success');
      } else {
        alert("CEP não encontrado.");
      }
    } catch (err) {
      alert("Erro ao buscar CEP.");
    } finally {
      setIsSearchingZip(false);
    }
  };

  const displayedItems = useMemo(() => {
    let processedItems = [...items];

    if (userLocation) {
        processedItems = processedItems
            .map(item => {
                if (item.lat && item.lng) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
                    return { ...item, distance: dist };
                }
                return { ...item, distance: 99999 };
            })
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .filter(item => (item.distance !== undefined ? item.distance <= searchRadius : true));
    } else {
        processedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return processedItems.slice(0, 8);
  }, [items, userLocation, searchRadius, calculateDistance]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const categories = Object.values(Category);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-brand-900 pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 animate-fadeIn">
            Alugue o que precisar,<br className="hidden md:block"/> ganhe com o que tem.
          </h1>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white p-2 rounded-full shadow-2xl flex items-center relative z-20 mb-12">
            <div className="pl-6 text-gray-400">
              <i className="fas fa-search text-lg"></i>
            </div>
            <input 
              type="text" 
              placeholder="O que você está procurando hoje?" 
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-full font-bold transition duration-200 shadow-lg">
              Buscar
            </button>
          </form>

          <div className="max-w-md mx-auto mb-10 animate-fadeIn">
            <div className="bg-brand-600 rounded-3xl p-6 md:p-8 text-center text-white relative overflow-hidden shadow-2xl border border-white/10 transition-transform hover:scale-[1.02] duration-300">
                <div className="relative z-10">
                    <h2 className="text-xl md:text-2xl font-black mb-3 leading-tight uppercase tracking-tight">
                        Transforme objetos em renda extra
                    </h2>
                    <button 
                        onClick={() => isAuthenticated ? navigate('/add-item') : navigate('/login')} 
                        className="bg-white text-brand-700 hover:bg-brand-50 px-10 py-3.5 rounded-2xl font-black text-base shadow-xl transition transform active:scale-95"
                    >
                        Anunciar Grátis
                    </button>
                </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center min-h-[40px]">
            {locationStatus === 'loading' && (
               <div className="flex items-center gap-3 text-brand-100 bg-brand-800/40 px-6 py-2.5 rounded-full backdrop-blur-md border border-white/10">
                  <i className="fas fa-circle-notch fa-spin"></i> 
                  <span className="text-sm font-medium">Buscando as melhores ofertas...</span>
               </div>
            )}
            {locationStatus === 'success' && currentCity && (
               <div className="text-brand-100 text-xs font-bold flex items-center gap-2 bg-green-900/30 px-5 py-2 rounded-full border border-green-500/30 animate-fadeIn">
                  <i className="fas fa-map-marker-alt text-green-400"></i> Próximos a <span className="text-white">{currentCity}</span>
               </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <span className="w-8 h-1 bg-brand-600 rounded-full"></span>
            Navegue por Categorias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          {categories.map((cat, idx) => (
            <button key={idx} onClick={() => navigate(`/search?category=${cat}`)} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 group">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-3 group-hover:bg-brand-600 group-hover:text-white transition-all">
                <i className={`fas fa-${getIconForCategory(cat)}`}></i>
              </div>
              <span className="text-xs font-bold text-gray-700 text-center uppercase tracking-tight">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {userLocation ? 'Perto de Você' : 'Novidades no Bora Alugar'}
                </h2>
            </div>
            {userLocation && (
                <div className="relative">
                    <button onClick={() => setShowRadiusFilter(!showRadiusFilter)} className="flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-4 py-2.5 rounded-xl border border-brand-100 transition shadow-sm">
                        Raio: {searchRadius}km <i className="fas fa-chevron-down text-[10px]"></i>
                    </button>
                    {showRadiusFilter && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-2 animate-fadeIn">
                            {[5, 10, 25, 50, 100].map(km => (
                                <button key={km} onClick={() => { setSearchRadius(km); setShowRadiusFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold ${searchRadius === km ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    Até {km} km
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {locationStatus === 'loading' ? (
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

function getIconForCategory(category: string): string {
  switch(category) {
    case Category.TOOLS: return 'tools';
    case Category.REAL_ESTATE: return 'home';
    case Category.GAMES: return 'gamepad';
    case Category.CAMPING: return 'campground';
    case Category.ELECTRONICS: return 'camera';
    case Category.VEHICLES: return 'car';
    case Category.PARTY: return 'birthday-cake';
    case Category.APPLIANCES: return 'blender';
    default: return 'box';
  }
}
