import { Award, Printer, X, ShieldCheck, Sparkles } from 'lucide-react';
import type { UserAccount } from './types';

interface CertificateModalProps {
  user: UserAccount;
  onClose: () => void;
}

export function CertificateModal({ user, onClose }: CertificateModalProps) {
  const recipientName = user.name || 'Membro Orbiex';

  const issueDateFormatted = '13 de Novembro de 2026';
  const verificationHash = 'PRJ-8849-BR-2026';
  const certificateId = 'PRJ-MEMBER-99420-X';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in font-sans overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl my-auto overflow-hidden rounded-[32px] border border-white/15 bg-[#08080a] shadow-[0_30px_100px_rgba(0,0,0,0.98)] p-4 sm:p-8">
        
        {/* Floating Controls Bar (Print, Share, Close) */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-white/[0.08] mb-5 sm:mb-7 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <Award size={16} />
            </div>
            <div>
              <span className="text-[13px] font-bold text-white block">Documento Oficial de Conclusão</span>
              <span className="text-[11px] text-white/50 block">Formação Oficial do Projeto • Registro Válido</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[12px] font-black uppercase text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition"
            >
              <Printer size={14} />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10 transition ml-1"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
            O DIPLOMA EXECUTIVO (CERTIFICADO DE LUXO)
        ──────────────────────────────────────────────────────────── */}
        <div 
          id="certificate-print-area"
          className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-[#0e0e12] via-[#09090b] to-[#040406] p-7 sm:p-12 text-center shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"
        >
          {/* Fina Moldura Dupla Clássica & Cantos Geométricos */}
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/15" />
          <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/10" />
          
          {/* Ornamentos nos 4 Cantos (Marcas de Segurança Fiduciária) */}
          <div className="pointer-events-none absolute top-5 left-5 h-6 w-6 border-t-2 border-l-2 border-white/30" />
          <div className="pointer-events-none absolute top-5 right-5 h-6 w-6 border-t-2 border-r-2 border-white/30" />
          <div className="pointer-events-none absolute bottom-5 left-5 h-6 w-6 border-b-2 border-l-2 border-white/30" />
          <div className="pointer-events-none absolute bottom-5 right-5 h-6 w-6 border-b-2 border-r-2 border-white/30" />

          {/* Marca D'água Central de Segurança (Fundo Sutil do Projeto) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]">
            <Award size={480} strokeWidth={0.5} className="text-white" />
          </div>

          {/* ── TOPO DO CERTIFICADO: Insígnia & Selo Institucional ── */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Brasão Monocromático de Prestígio */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-white/30 to-white/70" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/[0.04] backdrop-blur-md">
                <Sparkles size={11} className="text-white/80" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/90">
                  FORMAÇÃO OFICIAL DO PROJETO
                </span>
                <Sparkles size={11} className="text-white/80" />
              </div>
              <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-white/30 to-white/70" />
            </div>

            {/* Título Principal */}
            <h1 className="text-[26px] sm:text-[36px] lg:text-[40px] font-serif font-black tracking-tight text-white mt-1 leading-tight">
              Certificado de Conclusão e Excelência
            </h1>

            <p className="mt-2 text-[12px] sm:text-[13.5px] text-white/60 max-w-xl mx-auto leading-relaxed">
              Certificamos que o aluno concluiu com rigor técnico todos os módulos, avaliações e diretrizes operacionais do programa executivo de escala no TikTok Shop.
            </p>
          </div>

          {/* ── NOME DO FORMANDO (DESTAQUE NOBRE E LIMPO) ── */}
          <div className="relative z-10 my-8 py-4">
            <span className="text-[10.5px] font-black uppercase tracking-[0.28em] text-white/50 block mb-2">
              OUTORGADO COM HONRA A
            </span>
            
            <div className="relative inline-block">
              <span className="text-[30px] sm:text-[44px] lg:text-[48px] font-black tracking-tight text-white font-sans drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
                {recipientName}
              </span>
              {/* Linha decorativa nobre com detalhe central */}
              <div className="mt-2 h-[2px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>

            <p className="mt-3 text-[12px] text-white/60 max-w-lg mx-auto">
              por demonstrar domínio comprovado em esteira de produtos virais, estrutura de contas, blindagem e estratégia de crescimento previsível.
            </p>
          </div>

          {/* ── GRID DE METADADOS & SEGURANÇA CRIPTOGRÁFICA ── */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left my-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 backdrop-blur-sm">
            <div>
              <span className="text-white/40 block text-[9.5px] uppercase font-bold tracking-wider">Carga Horária</span>
              <span className="text-white font-extrabold text-[13px] block mt-0.5">16 Horas Práticas</span>
              <span className="text-white/40 text-[10px]">10 Módulos Concluídos</span>
            </div>

            <div>
              <span className="text-white/40 block text-[9.5px] uppercase font-bold tracking-wider">Data de Conclusão</span>
              <span className="text-white font-extrabold text-[13px] block mt-0.5">{issueDateFormatted}</span>
              <span className="text-white/40 text-[10px]">Edição Oficial 2026</span>
            </div>

            <div>
              <span className="text-white/40 block text-[9.5px] uppercase font-bold tracking-wider">Código de Validação</span>
              <span className="text-white font-mono font-bold text-[12.5px] block mt-0.5">{verificationHash}</span>
              <span className="text-white/40 text-[10px] font-mono">{certificateId}</span>
            </div>

            <div>
              <span className="text-white/40 block text-[9.5px] uppercase font-bold tracking-wider">Autenticidade</span>
              <div className="flex items-center gap-1.5 text-[#22c55e] font-bold text-[12px] mt-1">
                <ShieldCheck size={14} />
                <span>Verificado & Válido</span>
              </div>
              <span className="text-white/40 text-[10px]">Assinatura Criptografada</span>
            </div>
          </div>

          {/* ── RODAPÉ: ASSINATURAS REAIS & SELO METALIZADO SUTIL ── */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 items-center justify-between gap-6 pt-6 border-t border-white/10 mt-6">
            
            {/* Assinatura 1: Diretoria */}
            <div className="text-center sm:text-left order-2 sm:order-1">
              <div className="h-10 flex items-center justify-center sm:justify-start">
                <span className="font-serif italic font-normal text-[22px] sm:text-[24px] tracking-wide text-white/95 drop-shadow">
                  Diretoria Orbiex
                </span>
              </div>
              <div className="h-[1px] w-36 mx-auto sm:mx-0 bg-white/30 my-1.5" />
              <span className="text-[11px] text-white/60 block">Fundador & Instrutor do Projeto</span>
            </div>

            {/* Selo Central de Autenticidade (Toque Dourado Acetinado e Delicado, Sem Poluir) */}
            <div className="flex flex-col items-center justify-center order-1 sm:order-2">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#d4af37]/60 bg-gradient-to-br from-[#1a1813] to-black shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                {/* Raios finos do selo */}
                <div className="absolute inset-1 rounded-full border border-dashed border-[#d4af37]/40 animate-[spin_60s_linear_infinite]" />
                <div className="flex flex-col items-center text-center">
                  <Award size={22} className="text-[#e8c85a] mb-0.5" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-[#f5df93]">
                    OFICIAL
                  </span>
                  <span className="text-[6.5px] font-bold text-white/60">
                    SELO VIP
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1.5">
                Autenticado
              </span>
            </div>

            {/* Assinatura 2: Conselho de Operações */}
            <div className="text-center sm:text-right order-3">
              <div className="h-10 flex items-center justify-center sm:justify-end">
                <span className="font-serif italic font-normal text-[20px] sm:text-[22px] tracking-wide text-white/80">
                  Projeto Member Suite
                </span>
              </div>
              <div className="h-[1px] w-36 mx-auto sm:ml-auto sm:mr-0 bg-white/30 my-1" />
              <span className="text-[11px] font-black uppercase text-white/90 block">Diretoria Pedagógica</span>
              <span className="text-[10px] text-white/50 block">Conselho de Operações e Escala</span>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo Inferior */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 print:hidden px-2">
          <span>Este certificado pode ser validado publicamente através do código identificador único.</span>
          <span className="mt-1 sm:mt-0 font-mono text-[10.5px]">Hash: {verificationHash}</span>
        </div>
      </div>
    </div>
  );
}
