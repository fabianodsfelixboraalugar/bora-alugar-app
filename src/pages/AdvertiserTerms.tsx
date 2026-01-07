
import React from 'react';
import { BackButton } from '../components/BackButton';

export const AdvertiserTerms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="mb-10">
        <BackButton label="Voltar" />
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Termos Específicos para Anunciantes</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Última atualização: Julho de 2025</p>
        </div>

        <p className="text-lg text-gray-600 leading-relaxed mb-12">
          Este documento complementa os <strong>Termos e Condições Gerais de Uso da Bora Alugar</strong> e aplica-se exclusivamente aos usuários que anunciam itens ou serviços para aluguel na plataforma Bora Alugar, doravante denominados <strong>ANUNCIANTES</strong>. Ao publicar um anúncio, o ANUNCIANTE declara que leu, compreendeu e concorda integralmente com os presentes Termos Específicos.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">1. Papel do Anunciante</h2>
          <p className="text-gray-600">
            O ANUNCIANTE é o <strong>único e exclusivo responsável</strong> pelo item ou serviço anunciado, incluindo sua posse, disponibilidade, estado de conservação, legalidade e adequação ao uso proposto. A Bora Alugar atua exclusivamente como intermediadora digital, não sendo proprietária, depositária ou responsável pelos itens anunciados.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">2. Obrigações do Anunciante</h2>
          <p className="text-gray-600 mb-4">O ANUNCIANTE compromete-se a:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Fornecer informações <strong>verdadeiras, claras, completas e atualizadas</strong> no anúncio;</li>
            <li>Garantir que o item esteja em condições adequadas de uso e segurança;</li>
            <li>Cumprir integralmente as condições acordadas com o locatário;</li>
            <li>Responder às solicitações e mensagens em prazo razoável;</li>
            <li>Respeitar a legislação vigente, inclusive normas de consumo, civis e tributárias.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            O descumprimento dessas obrigações poderá resultar em <strong>suspensão ou exclusão</strong> da conta e do anúncio.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">3. Regras de Preço e Condições Comerciais</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>O preço do aluguel é definido <strong>livremente pelo ANUNCIANTE</strong>;</li>
            <li>Todos os valores devem ser informados de forma clara, incluindo taxas adicionais, cauções ou garantias, se houver;</li>
            <li>É proibida a prática de preços enganosos ou abusivos;</li>
            <li>Alterações de preço após a confirmação do aluguel somente poderão ocorrer mediante acordo entre as partes.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            A Bora Alugar não interfere na precificação, salvo para cumprimento de normas legais ou políticas internas.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">4. Conservação e Entrega do Item</h2>
          <p className="text-gray-600 mb-4">O ANUNCIANTE é responsável por:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Entregar o item em <strong>perfeito estado de funcionamento</strong>, salvo desgaste natural previamente informado;</li>
            <li>Orientar o locatário quanto ao uso correto e seguro do item;</li>
            <li>Informar previamente eventuais defeitos, limitações ou riscos;</li>
            <li>Estabelecer, de comum acordo, as condições de retirada e devolução.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Itens entregues em condições inadequadas poderão gerar <strong>sanções na plataforma</strong>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">5. Responsabilidade por Danos</h2>
          <p className="text-gray-600 mb-4">O ANUNCIANTE reconhece que:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>É responsável por danos decorrentes de <strong>defeitos ocultos, mau estado de conservação ou informações incorretas</strong>;</li>
            <li>Pode exigir do locatário reparação por danos causados por uso indevido, desde que devidamente comprovados;</li>
            <li>Eventuais garantias, cauções ou seguros devem ser previamente informados no anúncio.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            A Bora Alugar <strong>não se responsabiliza</strong> por danos, perdas, furtos, roubos ou prejuízos relacionados aos itens anunciados.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">6. Cancelamentos e Descumprimento</h2>
          <p className="text-gray-600">
            O ANUNCIANTE compromete-se a evitar cancelamentos injustificados. Cancelamentos frequentes ou descumprimento das condições anunciadas poderão resultar em: <strong>Redução de visibilidade do anúncio; Suspensão temporária; Exclusão definitiva da conta.</strong>
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">7. Fiscalização e Moderação</h2>
          <p className="text-gray-600 mb-4">A Bora Alugar reserva-se o direito de:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Solicitar documentos ou comprovações;</li>
            <li>Remover anúncios irregulares;</li>
            <li>Aplicar sanções em caso de violação destes Termos;</li>
            <li>Colaborar com autoridades competentes, quando exigido por lei.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-brand-500 pl-4 mb-6">8. Alterações destes Termos</h2>
          <p className="text-gray-600">
            A Bora Alugar poderá atualizar estes Termos Específicos a qualquer momento. O uso contínuo da plataforma após alterações implica aceitação automática dos novos termos.
          </p>
        </section>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
          <p className="text-brand-600 font-black uppercase tracking-widest mb-2">Bora Alugar</p>
          <p className="text-gray-400 text-sm italic">Alugue com praticidade. Compartilhe com confiança.</p>
        </div>
      </div>
    </div>
  );
};
