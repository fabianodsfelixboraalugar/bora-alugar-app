
import React from 'react';
import { BackButton } from '../components/BackButton';

export const CookiePolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="mb-10">
        <BackButton label="Voltar" />
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Política de Cookies</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Última atualização: Julho de 2025</p>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed mb-12">
          Esta Política de Cookies explica como o <strong>Bora Alugar</strong> utiliza cookies e tecnologias similares para reconhecê-lo quando você visita nossa plataforma. Ela explica o que são essas tecnologias e por que as usamos, bem como seus direitos de controlar o uso delas.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">O que são Cookies?</h2>
          <p className="text-gray-600">Cookies são pequenos arquivos de dados que são colocados no seu computador ou dispositivo móvel quando você visita um site. Eles são amplamente utilizados para fazer com que os sites funcionem, ou funcionem de forma mais eficiente, bem como para fornecer informações de relatórios.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">Por que usamos Cookies?</h2>
          <p className="text-gray-600 mb-6">Usamos cookies de primeira e terceira parte por vários motivos. Alguns cookies são necessários por razões técnicas para que nossa plataforma funcione, e nós os chamamos de cookies "essenciais" ou "estritamente necessários".</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-4">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">Essenciais (Funcionais)</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">Necessários para funções básicas como login, segurança e gerenciamento de conta. Sem eles, o site não funciona corretamente.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">Analíticos</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">Ajudam-nos a entender como os visitantes interagem com o site, coletando e reportando informações anonimamente para melhorias.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <i className="fas fa-bullhorn"></i>
              </div>
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">Marketing</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">Usados para rastrear visitantes em sites. A intenção é exibir anúncios que sejam relevantes e envolventes para o usuário individual.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">Como controlar Cookies?</h2>
          <p className="text-gray-600 mb-4">Você tem o direito de decidir se aceita ou rejeita cookies. Você pode exercer suas preferências de cookies através do banner de consentimento que aparece na sua primeira visita ou alterando as configurações do seu navegador.</p>
          <p className="text-gray-600">A maioria dos navegadores permite que você recuse cookies através de suas configurações de privacidade. Observe que, se você optar por rejeitar cookies, seu acesso a algumas funcionalidades e áreas do nosso site poderá ser restrito.</p>
        </section>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
          <p className="text-brand-600 font-black uppercase tracking-widest mb-2">Bora Alugar</p>
          <p className="text-gray-400 text-sm italic">Sua privacidade é respeitada em cada clique.</p>
        </div>
      </div>
    </div>
  );
};
