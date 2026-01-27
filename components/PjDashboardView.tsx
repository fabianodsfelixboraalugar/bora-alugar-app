
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Item, Rental, RentalStatus, UserPlan, ItemStatus, Category } from '../types';
import { useData } from '../context/DataContext';

interface PjDashboardViewProps {
  user: User;
  items: Item[];
  rentals: Rental[];
}

export const PjDashboardView: React.FC<PjDashboardViewProps> = ({ user, items, rentals }) => {
  const navigate = useNavigate();
  const { updateItem } = useData();
  const [filterCategory, setFilterCategory] = useState<string>('');

  const stats = useMemo(() => {
    const validRentals = rentals.filter(r => [RentalStatus.COMPLETED, RentalStatus.ACTIVE, RentalStatus.CONFIRMED].includes(r.status));
    const monthlyRevenue = validRentals.reduce((sum, r) => sum + r.totalPrice, 0);
    const rentedCount = items.filter(i => !i.available || i.status === ItemStatus.RENTED).length;
    const occupancyRate = items.length > 0 ? (rentedCount / items.length) * 100 : 0;
    
    return { monthlyRevenue, occupancyRate, available: items.filter(i => i.available).length };
  }, [items, rentals]);

  const handleToggle = (item: Item) => {
    updateItem(item.id, { available: !item.available });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Intelligence Locadora</h2>
              <p className="text-gray-500 text-sm font-medium">Dashboard empresarial para gestão de frota.</p>
          </div>
          <button 
            onClick={() => navigate('/add-item')}
            className="bg-brand-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-100 transition transform active:scale-95"
          >
              <i className="fas fa-plus mr-2"></i> Adicionar Item
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Faturamento Consolidado</p>
           <h3 className="text-4xl font-black text-gray-900">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</h3>
           <p className="text-[10px] text-brand-600 font-bold mt-4 uppercase">Valor total de locações ativas</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Taxa de Ocupação</p>
           <h3 className="text-4xl font-black text-gray-900">{stats.occupancyRate.toFixed(1)}%</h3>
           <div className="w-full bg-gray-50 h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-brand-500 h-full transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Itens em Frota</p>
           <h3 className="text-4xl font-black text-gray-900">{items.length}</h3>
           <p className="text-[10px] text-blue-600 font-bold mt-4 uppercase">{stats.available} unidades livres para alugar</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Gestão de Itens</h3>
            <select 
              className="text-[10px] font-bold text-gray-500 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-brand-500"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
               <option value="">Todas as Categorias</option>
               {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50">
                     <th className="px-8 py-5">Item</th>
                     <th className="px-8 py-5">Categoria</th>
                     <th className="px-8 py-5">Diária</th>
                     <th className="px-8 py-5">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {items.filter(i => !filterCategory || i.category === filterCategory).map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <img src={item.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                             <p className="text-sm font-bold text-gray-900">{item.title}</p>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-xs text-gray-500 font-medium uppercase">{item.category}</td>
                       <td className="px-8 py-5 text-xs font-black text-brand-600">R$ {item.pricePerDay}</td>
                       <td className="px-8 py-5">
                          <div className="flex gap-3">
                             <button onClick={() => handleToggle(item)} className={`w-10 h-10 rounded-xl transition flex items-center justify-center border ${item.available ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400'}`}>
                                <i className={`fas ${item.available ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                             </button>
                             <button onClick={() => navigate(`/add-item?edit=${item.id}`)} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:text-brand-500 transition flex items-center justify-center">
                                <i className="fas fa-pencil-alt"></i>
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
