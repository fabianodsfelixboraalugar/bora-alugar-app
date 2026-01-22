
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
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  const stats = useMemo(() => {
    const validRentals = rentals.filter(r => [RentalStatus.COMPLETED, RentalStatus.ACTIVE, RentalStatus.CONFIRMED].includes(r.status));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = validRentals
      .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const rentedItemsCount = items.filter(i => !i.available || i.status === ItemStatus.RENTED).length;
    const occupancyRate = items.length > 0 ? (rentedItemsCount / items.length) * 100 : 0;

    const inMaintenance = items.filter(i => i.status === ItemStatus.MAINTENANCE).length;
    const available = items.filter(i => i.available && i.status !== ItemStatus.MAINTENANCE).length;

    const itemCounts = rentals.reduce((acc, r) => {
      acc[r.itemId] = (acc[r.itemId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const keys = Object.keys(itemCounts);
    const starItemId = keys.length > 0 
        ? keys.reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b) 
        : '';
        
    const starItem = items.find(i => i.id === starItemId);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = rentals.filter(r => r.createdAt.startsWith(dateStr)).length;
      return { day: date.toLocaleDateString('pt-BR', { weekday: 'short' }), count };
    });

    const alerts = [];
    if (inMaintenance > 0) alerts.push({ type: 'warning', text: `${inMaintenance} itens em manutenção precisam de atenção.` });
    const planLimit = user.plan === UserPlan.FREE ? 2 : user.plan === UserPlan.BASIC ? 10 : 999;
    if (items.length >= planLimit * 0.9 && user.plan !== UserPlan.PREMIUM) {
      alerts.push({ type: 'danger', text: `Limite do Plano ${user.plan} atingindo! Faça upgrade para continuar anunciando.` });
    }
    if (rentals.filter(r => r.status === RentalStatus.PENDING).length > 0) {
      alerts.push({ type: 'info', text: `Você tem solicitações pendentes aguardando sua confirmação.` });
    }

    return { monthlyRevenue, occupancyRate, inventory: { inMaintenance, available, rented: rentedItemsCount }, starItem, last7Days, alerts };
  }, [items, rentals, user.plan]);

  const handleToggle = (item: Item) => {
    const nextState = !item.available;
    const nextStatus = nextState ? ItemStatus.AVAILABLE : ItemStatus.MAINTENANCE;
    updateItem(item.id, { available: nextState, status: nextStatus });
  };

  const getDisplayStatusInfo = (item: Item) => {
    if (item.status === ItemStatus.MAINTENANCE) return { label: 'MANUTENÇÃO', class: 'bg-orange-100 text-orange-700' };
    
    const now = new Date();
    const hasActiveRental = rentals.some(r => 
      r.itemId === item.id && 
      [RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.SHIPPED, RentalStatus.DELIVERED].includes(r.status) &&
      new Date(r.startDate) <= now && new Date(r.endDate) >= now
    );

    if (hasActiveRental) return { label: 'ALUGADO', class: 'bg-blue-100 text-blue-700' };
    if (item.available) return { label: 'DISPONÍVEL', class: 'bg-brand-50 text-brand-700' };
    return { label: 'INDISPONÍVEL', class: 'bg-gray-100 text-gray-400' };
  };

  const filteredItems = items.filter(i => {
    const matchesCat = filterCategory ? i.category === filterCategory : true;
    const matchesStat = filterStatus ? (filterStatus === 'Disponível' ? i.available : !i.available) : true;
    return matchesCat && matchesStat;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12 bg-[#F8FAF9]">
      {historyItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Histórico de Locação</h3>
                <p className="text-xs text-gray-400 font-bold uppercase truncate max-w-[250px]">{historyItem.title}</p>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-gray-400 hover:text-gray-600 p-2"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              {rentals.filter(r => r.itemId === historyItem.id && [RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.SHIPPED, RentalStatus.DELIVERED, RentalStatus.COMPLETED].includes(r.status)).length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <i className="far fa-calendar-times text-gray-200 text-4xl mb-4"></i>
                  <p className="text-gray-400 italic font-bold uppercase text-[10px] tracking-widest">Nenhum registro de locação encontrado.</p>
                </div>
              ) : (
                rentals
                  .filter(r => r.itemId === historyItem.id && [RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.SHIPPED, RentalStatus.DELIVERED, RentalStatus.COMPLETED].includes(r.status))
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map(r => (
                    <div key={r.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-md transition group">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg ${
                          r.status === RentalStatus.COMPLETED ? 'bg-gray-200 text-gray-600' : 
                          r.status === RentalStatus.ACTIVE ? 'bg-blue-100 text-blue-700' : 'bg-brand-50 text-brand-700'
                        }`}>
                          {r.status}
                        </span>
                        <span className="text-[10px] font-black text-brand-600">R$ {r.totalPrice}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                          <i className="far fa-calendar-alt text-xs"></i>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Período de Locação</p>
                          <p className="text-xs font-bold text-gray-500">
                            {new Date(r.startDate).toLocaleDateString('pt-BR')} até {new Date(r.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <button onClick={() => setHistoryItem(null)} className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition uppercase text-[10px] tracking-widest shadow-sm">Fechar Janela</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Painel da Locadora</h2>
                <p className="text-gray-500 text-sm font-medium">Gestão de Ativos e Inteligência de Negócios</p>
            </div>
            <button 
              onClick={() => navigate('/add-item')}
              className="bg-brand-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 transition transform active:scale-95"
            >
                <i className="fas fa-plus mr-2"></i> Adicionar Item
            </button>
        </div>

        {stats.alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex items-center gap-3 animate-fadeIn ${
                alert.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                alert.type === 'danger' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-brand-50 border-brand-100 text-brand-700'
              }`}>
                <i className={`fas ${alert.type === 'warning' ? 'fa-tools' : alert.type === 'danger' ? 'fa-rocket' : 'fa-bell'}`}></i>
                <span className="text-[11px] font-bold leading-snug">{alert.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition group">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Taxa de Ocupação</p>
           <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-gray-900">{stats.occupancyRate.toFixed(1)}%</h3>
              <span className="text-brand-500 text-xs font-bold">Portfólio Ativo</span>
           </div>
           <div className="w-full bg-gray-50 h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-brand-500 h-full transition-all duration-1000 ease-out" style={{ width: `${stats.occupancyRate}%` }}></div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition group">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Faturamento Mensal</p>
           <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-gray-900">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</h3>
           </div>
           <p className="text-[10px] text-brand-600 font-bold mt-4 uppercase">Últimos 30 dias</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition group">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Item Estrela</p>
           {stats.starItem ? (
             <div className="flex items-center gap-3 mt-2">
                <img src={stats.starItem.images[0]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{stats.starItem.title}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{stats.starItem.category}</p>
                </div>
             </div>
           ) : (
             <p className="text-xs text-gray-400 mt-4 italic font-medium">Aguardando dados...</p>
           )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition group">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Status Inventário</p>
           <div className="flex justify-between items-end gap-2">
              <div className="text-center flex-1">
                 <p className="text-xl font-black text-brand-500">{stats.inventory.available}</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase">Livres</p>
              </div>
              <div className="text-center flex-1">
                 <p className="text-xl font-black text-blue-500">{stats.inventory.rented}</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase">Alugados</p>
              </div>
              <div className="text-center flex-1">
                 <p className="text-xl font-black text-orange-500">{stats.inventory.inMaintenance}</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase">Manut.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Novas Reservas (7d)</h3>
           <div className="flex items-end justify-between h-48 gap-3 px-2">
              {stats.last7Days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                   <div 
                     className="w-full bg-brand-100 rounded-t-xl transition-all duration-700 group-hover:bg-brand-500 relative"
                     style={{ height: `${Math.max(10, (d.count / (Math.max(...stats.last7Days.map(x => x.count)) || 1)) * 100)}%` }}
                   >
                     {d.count > 0 && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-brand-700">{d.count}</span>}
                   </div>
                   <span className="text-[9px] font-black text-gray-300 uppercase">{d.day}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Gestão de Inventário</h3>
              <div className="flex gap-2">
                 <select 
                   className="text-[10px] font-bold text-gray-500 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-brand-500 bg-gray-50"
                   value={filterCategory}
                   onChange={e => setFilterCategory(e.target.value)}
                 >
                    <option value="">Categorias</option>
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <select 
                   className="text-[10px] font-bold text-gray-500 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-brand-500 bg-gray-50"
                   value={filterStatus}
                   onChange={e => setFilterStatus(e.target.value)}
                 >
                    <option value="">Status</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Alugado">Alugado</option>
                 </select>
              </div>
           </div>
           
           <div className="flex-1 overflow-x-auto p-4">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50">
                       <th className="px-4 py-4">Item</th>
                       <th className="px-4 py-4">Diária</th>
                       <th className="px-4 py-4">Status</th>
                       <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {filteredItems.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest italic">Nenhum item encontrado nos filtros</td></tr>
                    ) : filteredItems.map(item => {
                      const statusInfo = getDisplayStatusInfo(item);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition group">
                           <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shadow-sm">
                                    <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate">{item.title}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{item.category}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-4 text-xs font-black text-brand-600">R$ {item.pricePerDay}</td>
                           <td className="px-4 py-4">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${statusInfo.class}`}>
                                 {statusInfo.label}
                              </span>
                           </td>
                           <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                 <button 
                                   onClick={() => handleToggle(item)}
                                   title={item.available ? "Marcar como Indisponível" : "Marcar como Disponível"}
                                   className={`w-8 h-8 rounded-lg transition flex items-center justify-center border ${item.available ? 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white border-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-500 hover:text-white border-gray-200'}`}
                                 >
                                   <i className={`fas ${item.available ? 'fa-toggle-on' : 'fa-toggle-off'} text-[12px]`}></i>
                                 </button>
                                 <button onClick={() => navigate(`/add-item?edit=${item.id}`)} title="Editar" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-brand-500 hover:bg-white border border-transparent hover:border-gray-100 transition flex items-center justify-center"><i className="fas fa-pencil-alt text-[10px]"></i></button>
                                 <button onClick={() => setHistoryItem(item)} title="Histórico" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-white border border-transparent hover:border-gray-100 transition flex items-center justify-center"><i className="fas fa-history text-[10px]"></i></button>
                                 <button title="Manutenção" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-orange-500 hover:bg-white border border-transparent hover:border-gray-100 transition flex items-center justify-center"><i className="fas fa-tools text-[10px]"></i></button>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
