
import React from 'react';
import { BackButton } from '../components/BackButton';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="mb-10">
        <BackButton label="Voltar" />
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Termos e Condições Gerais de Uso</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Última atualização: Julho de 2025</p>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed mb-12">
          Bem-vindo à <strong>Bora Alugar</strong>! 👋<br/><br/>
          A Bora Alugar é uma plataforma digital que conecta pessoas interessadas em alugar e disponibilizar para aluguel diferentes tipos de bens e serviços, promovendo o consumo colaborativo, a economia e a praticidade. Ao acessar ou utilizar a plataforma Bora Alugar (site e/ou aplicativo), você declara que leu, compreendeu e concorda integralmente com estes Termos e Condições Gerais de Uso.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">1. Quem somos</h2>
          <p className="text-gray-600">A Bora Alugar é uma plataforma online de intermediação de anúncios de aluguel, não sendo proprietária dos itens anunciados nem parte direta das negociações realizadas entre os usuários. A responsabilidade da Bora Alugar limita-se à disponibilização do ambiente digital, ferramentas tecnológicas e funcionalidades que permitem a conexão entre anunciantes e locatários.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">2. Funcionamento da plataforma</h2>
          <p className="text-gray-600 mb-4">A Bora Alugar oferece um espaço online para:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Publicação de anúncios de itens e serviços para aluguel;</li>
            <li>Busca, contato e negociação entre usuários;</li>
            <li>Comunicação via chat interno da plataforma.</li>
          </ul>
          <p className="text-gray-600 mt-4">A Bora Alugar não interfere na negociação, definição de preços, condições de entrega, retirada, devolução ou pagamento entre os usuários, salvo quando funcionalidades específicas forem claramente indicadas.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">3. Elegibilidade</h2>
          <p className="text-gray-600 mb-4">Para utilizar a plataforma, você deve:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Ter 18 anos ou mais;</li>
            <li>Fornecer informações verdadeiras, completas e atualizadas;</li>
            <li>Concordar com estes Termos e com as demais políticas da Bora Alugar.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">4. Cadastro e conta do usuário</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Cada usuário pode manter apenas uma conta;</li>
            <li>A conta é pessoal, intransferível e de responsabilidade exclusiva do titular;</li>
            <li>O usuário é responsável por manter a confidencialidade de sua senha e acessos;</li>
            <li>Todas as ações realizadas pela conta serão consideradas de responsabilidade do usuário.</li>
          </ul>
          <p className="text-gray-600 mt-4">A Bora Alugar poderá suspender ou excluir contas que violem estes Termos ou a legislação vigente.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">6. Anúncios</h2>
          <h3 className="text-lg font-bold text-gray-800 mb-2">6.1 Responsabilidade</h3>
          <p className="text-gray-600 mb-4">O usuário anunciante é integralmente responsável:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Pela veracidade das informações do anúncio;</li>
            <li>Pela posse, disponibilidade e condições do item anunciado;</li>
            <li>Pela entrega, retirada, devolução e conservação do item;</li>
            <li>Pelo cumprimento das obrigações legais e tributárias.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">10. Relação entre usuários</h2>
          <p className="text-gray-600">A Bora Alugar <strong>não se responsabiliza</strong> por conflitos, danos, prejuízos ou perdas decorrentes de negociações realizadas entre usuários. Qualquer disputa deverá ser resolvida diretamente entre as partes envolvidas.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">13. Foro</h2>
          <p className="text-gray-600">Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias, salvo disposições legais em contrário.</p>
        </section>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
          <p className="text-brand-600 font-black uppercase tracking-widest mb-2">Bora Alugar</p>
          <p className="text-gray-400 text-sm italic">Alugue com praticidade. Compartilhe com confiança.</p>
        </div>
      </div>
    </div>
  );
};
