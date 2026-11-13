import { useMemo } from 'react';
import {
  Play,
  Award,
  Check,
} from 'lucide-react';
import type { CourseData, Lesson, UserAccount } from './types';

interface CourseDashboardProps {
  course: CourseData;
  user: UserAccount;
  completedLessons: string[];
  customModuleCovers: Record<string, string>;
  onSaveModuleCover?: (moduleId: string, dataUrl: string) => void;
  onResetModuleCover?: (moduleId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenCertificate: () => void;
  onResetProgress?: () => void;
  searchQuery: string;
}

export function CourseDashboard({
  course,
  user,
  completedLessons,
  customModuleCovers,
  onSelectLesson,
  onOpenCertificate,
  searchQuery,
}: CourseDashboardProps) {
  // Banner oficial fixo da Formação do Projeto
  const heroCover = '/assets/banner-formacao-oficial-hd.jpg';

  // Flatten all lessons
  const allLessons = useMemo(() => {
    return course.modules.flatMap((m) => m.lessons);
  }, [course]);

  // Next up lesson to resume
  const nextLesson = useMemo(() => {
    return allLessons.find((l) => !completedLessons.includes(l.id)) || allLessons[0];
  }, [allLessons, completedLessons]);

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return course.modules;
    const q = searchQuery.toLowerCase().trim();
    return course.modules
      .map((m) => {
        const matchedLessons = m.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.takeaways.some((t) => t.toLowerCase().includes(q))
        );
        return {
          ...m,
          lessons: matchedLessons,
        };
      })
      .filter((m) => m.lessons.length > 0 || m.title.toLowerCase().includes(q));
  }, [course.modules, searchQuery]);

  return (
    <div className="space-y-10 pb-20 animate-fade-up" aria-label={`Área de Formação do Projeto - ${user.name}`}>
      {/* ────────────────────────────────────────────────────────────
          1. HERO BANNER: DESTAQUE ELEGANTE, LIMPO E SEM POLUIÇÃO
      ──────────────────────────────────────────────────────────── */}
      <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#141318] via-[#0c0c0e] to-black p-7 sm:p-10 lg:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.92)] min-h-[320px] sm:min-h-[380px] lg:min-h-[430px] flex flex-col justify-end transition-all duration-300">
        {/* Ambient backglow neutro */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-white/[0.03] blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-white/[0.02] blur-[150px]" />

        {/* Foto de fundo preenchendo o banner inteiro */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={heroCover}
            alt="Formação do Projeto"
            decoding="async"
            className="absolute inset-y-0 left-0 h-full w-full max-w-none object-cover object-[65%_35%] sm:w-[128%] sm:object-[center_35%]"
          />
          {/* Sombra leve só atrás do texto, sem escurecer a foto */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent sm:w-[60%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Tipografia Minimalista e de Alto Impacto: Dourado mantido exclusivamente em 'PROJETO OFICIAL' e 'Formação do Projeto' */}
        <div className="relative z-10 max-w-lg">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-[#d4af37] block mb-1 drop-shadow">
            PROJETO OFICIAL
          </span>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[48px] font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
            Formação do <span className="bg-gradient-to-r from-white via-[#f5df93] to-[#d4af37] bg-clip-text text-transparent">Projeto</span>
          </h1>
          <p className="mt-2.5 text-[13px] sm:text-[14px] text-white/70 font-normal leading-relaxed line-clamp-2 drop-shadow">
            {course.subtitle}
          </p>

          {/* Botões de Ação Direta no Banner */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {nextLesson && (
              <button
                type="button"
                onClick={() => onSelectLesson(nextLesson)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-black shadow-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Play size={15} fill="black" />
                <span>Continuar de Onde Parou</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCertificate}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-4 py-2.5 text-[13px] font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-all"
            >
              <Award size={15} className="text-[var(--mvz-gold)]" />
              <span>Ver Certificado</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. GRADE DE MÓDULOS (FORMATO 9:16)
      ──────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-[18px] sm:text-[20px] font-black text-white tracking-tight">
              Trilha Completa de Módulos
            </h2>
            <p className="text-[12px] text-white/50 mt-0.5">
              Selecione um módulo para acessar as aulas e materiais
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/70">
            {filteredModules.length} módulos
          </span>
        </div>

        {/* Modules Grid 9:16 (Formato maior e mais largo na versão desktop: 3 colunas em vez de 5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {filteredModules.map((module) => {
            const moduleCompletedCount = module.lessons.filter((l) =>
              completedLessons.includes(l.id)
            ).length;
            const isModuleComplete =
              module.lessons.length > 0 && moduleCompletedCount === module.lessons.length;
            const moduleProgress =
              module.lessons.length > 0
                ? Math.round((moduleCompletedCount / module.lessons.length) * 100)
                : 0;

            // Foto personalizada ou capa oficial configurada
            const activeCover =
              customModuleCovers[module.id] || module.coverImage;

            return (
              <div
                key={module.id}
                onClick={() => onSelectLesson(module.lessons[0])}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0c10] shadow-[0_20px_60px_rgba(0,0,0,0.85)] hover:border-white/40 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(255,255,255,0.08)] transition-all duration-300 aspect-[9/16] cursor-pointer"
              >
                {/* ── IMAGEM DE CAPA EM FORMATO 9:16 (FOTO REAL LIMPA) ── */}
                <img
                  src={activeCover}
                  alt={module.title}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== module.coverImage) {
                      target.src = module.coverImage;
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />

                {/* Vinheta suave na base para manter 80%+ da foto totalmente limpa e visível */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity group-hover:opacity-75 pointer-events-none" />

                {/* ── TOPO DO CARD: Badge minimalista discreta + Status Concluído ── */}
                <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur-md shadow">
                    MÓDULO {module.number}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isModuleComplete && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#22c55e]/40 bg-black/80 px-2.5 py-0.5 text-[9.5px] font-black text-[#22c55e] backdrop-blur-md">
                        <Check size={10} strokeWidth={3} />
                        CONCLUÍDO
                      </span>
                    )}
                  </div>
                </div>

                {/* ── CENTRO DO CARD: Botão de Play Transparente de Vidro que surge suavemente ao passar o mouse ── */}
                <div className="relative z-10 flex flex-1 items-center justify-center pointer-events-none">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 border border-white/40 text-white backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.25)] opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-110">
                    <Play size={20} fill="white" className="ml-0.5 text-white" />
                  </div>
                </div>

                {/* ── BASE DO CARD: Informações essenciais minimalistas e organizadas (sem poluição) ── */}
                <div className="relative z-10 p-5 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12">
                  <h3 className="text-[17px] sm:text-[19px] font-black text-white tracking-tight leading-snug group-hover:text-white transition">
                    {module.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11.5px] text-white/50 font-medium mt-2">
                    <span>{module.lessons.length} aulas</span>
                    <span>{moduleCompletedCount}/{module.lessons.length} concluídas</span>
                  </div>

                  {/* Microbarra de Progresso Branca Padrão */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${moduleProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
