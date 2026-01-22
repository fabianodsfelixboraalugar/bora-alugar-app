
import React from 'react';
import { BackButton } from '../components/BackButton';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="mb-10">
        <BackButton label="Voltar" />
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Política de Privacidade</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Última atualização: Julho de 2025</p>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed mb-12">
          A Bora Alugar valoriza a privacidade e a proteção dos dados pessoais de seus usuários. Esta Política de Privacidade explica de forma clara e transparente como os dados pessoais são coletados, utilizados, armazenados e protegidos quando você acessa ou utiliza nossa plataforma.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">1. Aplicação desta Política</h2>
          <p className="text-gray-600">Esta Política aplica-se a todos os usuários da plataforma Bora Alugar, incluindo anunciantes, locatários, visitantes, parceiros, prestadores de serviços e demais pessoas que interajam com nossos serviços. Recomendamos que você leia as políticas de privacidade de terceiros antes de utilizá-los.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">2. Conceito de Dados Pessoais</h2>
          <p className="text-gray-600">Dados pessoais são todas as informações que identificam ou podem identificar uma pessoa física, direta ou indiretamente, como nome, CPF, endereço, telefone, e-mail, dados de pagamento, localização, entre outros.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">3. Dados Pessoais que coletamos e finalidades</h2>
          <p className="text-gray-600 mb-6">A Bora Alugar poderá coletar e tratar os seguintes dados pessoais:</p>
          
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">a) Dados cadastrais e de identificação</h3>
              <p className="text-sm text-gray-600 mb-2"><strong>Exemplos:</strong> nome completo, CPF, documento de identificação, e-mail, telefone, endereço, fotos.</p>
              <p className="text-sm text-gray-600"><strong>Finalidades:</strong> Criar e gerenciar contas; Autenticar identidade; Viabilizar anúncios e negociações; Cumprir obrigações legais.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">b) Dados de autenticação e segurança</h3>
              <p className="text-sm text-gray-600 mb-2"><strong>Exemplos:</strong> senha criptografada, registros de login, endereço IP, geolocalização aproximada.</p>
              <p className="text-sm text-gray-600"><strong>Finalidades:</strong> Prevenir fraudes; Garantir segurança da plataforma; Cumprir obrigações legais.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-3">c) Dados financeiros</h3>
              <p className="text-sm text-gray-600 mb-2"><strong>Exemplos:</strong> dados bancários, meios de pagamento, histórico de transações.</p>
              <p className="text-sm text-gray-600"><strong>Finalidades:</strong> Processar pagamentos e repasses; Cumprir obrigações fiscais; Prevenir fraudes.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">4. Compartilhamento de Dados</h2>
          <p className="text-gray-600">A Bora Alugar <strong>não vende</strong> dados pessoais. Os dados poderão ser compartilhados apenas quando necessário, com outros usuários para viabilizar negociações, parceiros contratados, instituições financeiras ou autoridades públicas mediante obrigação legal.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">5. Direitos do Titular (LGPD)</h2>
          <p className="text-gray-600 mb-4">Você possui os seguintes direitos:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Confirmar a existência de tratamento de dados;</li>
            <li>Acessar seus dados pessoais e corrigir dados incompletos;</li>
            <li>Solicitar a exclusão ou anonimização de seus dados;</li>
            <li>Solicitar portabilidade e revogar consentimentos.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">8. Medidas de segurança</h2>
          <p className="text-gray-600">Adotamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais, incluindo controle de acesso restrito, criptografia de senhas, monitoramento de segurança e boas práticas de governança.</p>
        </section>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
          <p className="text-brand-600 font-black uppercase tracking-widest mb-2">Bora Alugar</p>
          <p className="text-gray-400 text-sm italic">Sua privacidade é nossa prioridade.</p>
        </div>
      </div>
    </div>
  );
};
