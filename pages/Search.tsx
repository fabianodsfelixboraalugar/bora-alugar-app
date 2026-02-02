
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useData } from '../context/DataContext';
import { ItemCard } from '../components/ItemCard';
import { Category } from '../types';

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  
  const { items, userLocation, calculateDistance } = useData();
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [cityFilter, setCityFilter] = useState('');
  
  const [isResolvingCity, setIsResolvingCity] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<{url: string, title: string}[]>([]);

  const filteredItems = useMemo(() => {
    let results = items.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) || 
                           item.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesCity = cityFilter ? item.city.toLowerCase().includes(cityFilter.toLowerCase()) : true;
      const matchesPrice = item.pricePerDay <= priceRange;
      
      return matchesQuery && matchesCategory && matchesCity && matchesPrice;
    });

    if (userLocation) {
        results = results.map(item => {
            if (item.lat && item.lng) {
                return { ...item, distance: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng) };
            }
            return { ...item, distance: 99999 };
        }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return results;
  }, [items, query, selectedCategory, cityFilter, priceRange, userLocation, calculateDistance]);

  const resolveCityWithMaps = async () => {
    if (!process.env.API_KEY) {
        alert("API Key não configurada para busca georreferenciada.");
        return;
    }
    
    setIsResolvingCity(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let prompt = `Identifique a cidade exata descrita por: "${cityFilter}". Retorne apenas o nome limpo da cidade.`;
        
        // Changed model to gemini-2.5-flash as it is required for Google Maps grounding
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleMaps: {} }] },
        });

        if (response.text) {
            setCityFilter(response.text.trim().replace(/\.$/, ''));
        }

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const links = chunks.map((c: any) => ({
                url: c.maps?.uri || '',
                title: c.maps?.title || 'Fonte: Google Maps'
            })).filter((l: any) => l.url);
            setGroundingLinks(links);
        }
    } catch (error) {
        console.error("Erro na busca por mapas:", error);
    } finally {
        setIsResolvingCity(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explorar</h1>
        {userLocation && (
            <div className="flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-xl border border-brand-100 text-sm font-bold animate-fadeIn">
                <i className="fas fa-location-arrow"></i> Resultados ordenados por distância
            </div>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="fas fa-sliders-h text-brand-600"></i> Filtros de Busca
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Termo de busca</label>
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="O que você procura?"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                    />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Categoria</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                >
                  <option value="">Todas</option>
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Localização</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                  />
                  {cityFilter && (
                      <button onClick={resolveCityWithMaps} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:bg-brand-50 p-1.5 rounded-lg">
                          {isResolvingCity ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-map-marked-alt"></i>}
                      </button>
                  )}
                </div>
              </div>

              {groundingLinks.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 animate-fadeIn">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Fontes Grounding:</p>
                      {groundingLinks.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-500 underline font-bold truncate">
                              {link.title}
                          </a>
                      ))}
                  </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">
                  Preço Máximo: <span className="text-brand-600">R$ {priceRange}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="50"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>
            
            <button 
                onClick={() => { setQuery(''); setSelectedCategory(''); setCityFilter(''); setPriceRange(5000); setGroundingLinks([]); }}
                className="w-full mt-8 py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition border-t border-gray-100 pt-6"
            >
                <i className="fas fa-undo mr-1"></i> Limpar Filtros
            </button>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          <div className="mb-6 flex justify-between items-center text-sm text-gray-500 px-2">
            <span><strong>{filteredItems.length}</strong> itens encontrados</span>
          </div>
          
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <i className="fas fa-search text-5xl text-gray-200 mb-6"></i>
              <p className="text-xl text-gray-500 font-bold">Nenhum resultado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
