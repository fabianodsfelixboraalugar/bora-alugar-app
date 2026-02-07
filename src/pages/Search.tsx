import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ItemCard } from '../components/ItemCard';
import { Category } from '../types';
import { aiService } from '../services/aiService';

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

  const filteredItems = useMemo(() => {
    let results = items.filter(item => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = selectedCategory
        ? item.category === selectedCategory
        : true;

      const matchesCity = cityFilter
        ? item.city.toLowerCase().includes(cityFilter.toLowerCase())
        : true;

      const matchesPrice = item.pricePerDay <= priceRange;

      return matchesQuery && matchesCategory && matchesCity && matchesPrice;
    });

    if (userLocation) {
      results = results
        .map(item => {
          if (item.lat && item.lng) {
            return {
              ...item,
              distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                item.lat,
                item.lng
              ),
            };
          }
          return { ...item, distance: 99999 };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return results;
  }, [
    items,
    query,
    selectedCategory,
    cityFilter,
    priceRange,
    userLocation,
    calculateDistance,
  ]);

  const resolveCityWithAI = async () => {
    if (!cityFilter) return;

    setIsResolvingCity(true);
    try {
      const city = await aiService.generateContent({
        prompt: `Retorne APENAS o nome da cidade para: ${cityFilter}`,
      });

      setCityFilter(city.replace(/\.$/, '').trim());
    } catch (error) {
      console.error('Erro ao resolver cidade:', error);
    } finally {
      setIsResolvingCity(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Explorar</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* FILTROS */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-4">Filtros</h3>

            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full mb-4 px-4 py-2 border rounded-xl"
            />

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full mb-4 px-4 py-2 border rounded-xl"
            >
              <option value="">Todas categorias</option>
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative mb-4">
              <input
                type="text"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                placeholder="Cidade"
                className="w-full px-4 py-2 border rounded-xl"
              />
              {cityFilter && (
                <button
                  onClick={resolveCityWithAI}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                >
                  {isResolvingCity ? '...' : 'Resolver'}
                </button>
              )}
            </div>

            <label className="text-sm font-bold">
              Preço até: R$ {priceRange}
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="w-full lg:w-3/4">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border">
              <p className="text-gray-500 font-bold">
                Nenhum item encontrado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
