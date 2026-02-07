
import React, { useState } from 'react';
import { BackButton } from '../components/BackButton';

export const Help: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Suporte Geral',
    message: ''
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de envio
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setFormData({ name: '', email: '', subject: 'Suporte Geral', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8">
        <BackButton label="Voltar" />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Como podemos te ajudar?</h1>
        <p className="text-gray-500 max-w-xl mx-auto font-medium">Estamos aqui para garantir que sua experiência no Bora Alugar seja incrível. Se tiver dúvidas, sugestões ou problemas, utilize o formulário abaixo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-brand-50 p-8 rounded-[2.5rem] border border-brand-100 shadow-sm">
            <h3 className="text-xl font-black text-brand-700 uppercase tracking-tight mb-4">Fale com a gente</h3>
            <p className="text-sm text-brand-600 font-medium mb-6">Nossa equipe de suporte responde em média em até 4 horas úteis.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-brand-700">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fas fa-envelope"></i>
                </div>
                <span className="font-bold text-sm">suporte@boraalugar.com.br</span>
              </div>
              <div className="flex items-center gap-4 text-brand-700">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <span className="font-bold text-sm">(11) 99999-0000</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">FAQ Rápido</h3>
            <div className="space-y-4">
              <details className="group border-b border-gray-50 pb-3">
                <summary className="list-none font-bold text-sm text-gray-700 cursor-pointer flex justify-between items-center">
                  Como funciona o pagamento?
                  <i className="fas fa-plus text-[10px] group-open:rotate-45 transition-transform"></i>
                </summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Os pagamentos são processados via nossa plataforma segura. O proprietário recebe o valor após a confirmação da entrega do item.</p>
              </details>
              <details className="group border-b border-gray-50 pb-3">
                <summary className="list-none font-bold text-sm text-gray-700 cursor-pointer flex justify-between items-center">
                  É seguro alugar meus itens?
                  <i className="fas fa-plus text-[10px] group-open:rotate-45 transition-transform"></i>
                </summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Sim! Todos os membros passam por verificação de identidade e temos um sistema de avaliações rigoroso para manter a comunidade segura.</p>
              </details>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-fadeIn">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-100">
                <i className="fas fa-check text-3xl"></i>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Mensagem Enviada!</h3>
              <p className="text-sm text-gray-500">Obrigado por entrar em contato. Responderemos em breve.</p>
              <button onClick={() => setSent(false)} className="mt-8 text-brand-600 font-bold uppercase text-xs tracking-widest hover:underline">Enviar outra mensagem</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Mande sua mensagem</h3>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <input 
                  type="text" required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail de Contato</label>
                <input 
                  type="email" required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assunto</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition font-bold"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                >
                  <option value="Suporte Geral">Suporte Geral</option>
                  <option value="Problemas com Aluguel">Problemas com Aluguel</option>
                  <option value="Pagamentos e Planos">Pagamentos e Planos</option>
                  <option value="Segurança e Denúncias">Segurança e Denúncias</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mensagem</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[2rem] px-5 py-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition font-medium resize-none"
                  placeholder="Como podemos te ajudar hoje?"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-2xl shadow-lg transition transform active:scale-95 uppercase text-xs tracking-widest mt-4">
                Enviar Mensagem
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
