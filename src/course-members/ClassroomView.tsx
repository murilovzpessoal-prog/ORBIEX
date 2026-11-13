import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Play,
  CheckCircle2,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  Download,
  FileText,
  Star,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Copy,
  BookOpen,
  Square,
  CheckSquare,
  ExternalLink,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import type { CourseData, Lesson, LessonAttachment, LessonComment } from './types';

interface ClassroomViewProps {
  course: CourseData;
  lesson: Lesson;
  completedLessons: string[];
  favoriteLessons: string[];
  customVideos: Record<string, string>;
  onSelectLesson: (l: Lesson) => void;
  onToggleComplete: (lessonId: string) => void;
  onWatchProgress?: (lessonId: string, fraction: number) => void;
  onToggleFavorite: (lessonId: string) => void;
  onSaveCustomVideo: (lessonId: string, url: string) => void;
  onBackToDashboard: () => void;
  showToast: (msg: string) => void;
}

export function ClassroomView({
  course,
  lesson,
  completedLessons,
  favoriteLessons,
  customVideos,
  onSelectLesson,
  onToggleComplete,
  onWatchProgress,
  onToggleFavorite,
  onBackToDashboard,
  showToast,
}: ClassroomViewProps) {
  const [theaterMode, setTheaterMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'notes' | 'comments'>('overview');
  const [starRating, setStarRating] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastReportedRef = useRef(0);

  // Envia o quanto da aula foi assistido (a cada 2% de avanço, para não pesar)
  const reportWatch = (video: HTMLVideoElement, force = false) => {
    if (!onWatchProgress || !video.duration || !isFinite(video.duration)) return;
    const fraction = video.currentTime / video.duration;
    if (force || fraction - lastReportedRef.current >= 0.02) {
      lastReportedRef.current = fraction;
      onWatchProgress(lesson.id, fraction);
    }
  };

  // Persistent student notes per lesson
  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(`projeto_course_notes_${lesson.id}`) || '';
    } catch {
      return '';
    }
  });

  // Persistent checklist steps
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`projeto_course_steps_${lesson.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Comments state
  const [comments, setComments] = useState<LessonComment[]>(lesson.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Open modules in accordion sidebar
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    [lesson.moduleId]: true,
  });

  const activeVideoUrl = customVideos[lesson.id] || lesson.videoUrl || '';

  // Find current module cover for cinema backdrop
  const currentModule = course.modules.find((m) => m.id === lesson.moduleId);
  const posterImage = currentModule?.coverImage || lesson.coverImage || '/assets/thumb-continuar-aula.jpg';

  // Reset player & states on lesson change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlaying(false);
    lastReportedRef.current = 0;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    try {
      const storedNotes = localStorage.getItem(`projeto_course_notes_${lesson.id}`) || '';
      setNotes(storedNotes);
      const storedSteps = localStorage.getItem(`projeto_course_steps_${lesson.id}`);
      setCheckedSteps(storedSteps ? JSON.parse(storedSteps) : {});
    } catch {}
    setComments(lesson.comments || []);
    setExpandedModules((prev) => ({ ...prev, [lesson.moduleId]: true }));
  }, [lesson.id]);

  // Attach HLS stream when playing starts
  useEffect(() => {
    if (!isPlaying || !activeVideoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const isHlsStream = activeVideoUrl.includes('.m3u8');

    if (isHlsStream) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;
        hls.loadSource(activeVideoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari / iOS)
        video.src = activeVideoUrl;
        video.play().catch(() => {});
      }
    } else {
      video.src = activeVideoUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isPlaying, activeVideoUrl]);

  // Flattened lessons list for prev/next
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = completedLessons.includes(lesson.id);
  const isFavorite = favoriteLessons.includes(lesson.id);

  // Toggle module in sidebar
  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Toggle step
  const toggleStep = (idx: number) => {
    const updated = { ...checkedSteps, [idx]: !checkedSteps[idx] };
    setCheckedSteps(updated);
    try {
      localStorage.setItem(`projeto_course_steps_${lesson.id}`, JSON.stringify(updated));
    } catch {}
  };

  // Save notes
  const handleNotesChange = (text: string) => {
    setNotes(text);
    try {
      localStorage.setItem(`projeto_course_notes_${lesson.id}`, text);
    } catch {}
  };

  // Add comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: LessonComment = {
      id: `c_${Date.now()}`,
      author: 'Você (Membro)',
      timeAgo: 'Agora mesmo',
      text: newCommentText.trim(),
      likes: 0,
    };
    setComments([newComment, ...comments]);
    setNewCommentText('');
    showToast('Comentário publicado com sucesso!');
  };

  // Helper for embed URL
  const getEmbedUrl = (raw: string): string => {
    if (!raw) return '';
    if (raw.includes('youtube.com/watch?v=')) {
      const id = raw.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (raw.includes('youtu.be/')) {
      const id = raw.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (raw.includes('vimeo.com/')) {
      const id = raw.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return raw;
  };

  const embedUrl = getEmbedUrl(activeVideoUrl);
  const isEmbed = embedUrl.includes('youtube.com') || embedUrl.includes('player.vimeo.com');

  // Render an attachment card (supports external links, tokens, and files)
  const renderAttachmentCard = (att: LessonAttachment) => (
    <div
      key={att.id}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/15 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent p-4 sm:p-5 hover:border-white/30 transition"
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 shadow-inner">
          {att.token ? <KeyRound size={20} /> : att.url ? <ExternalLink size={20} /> : <FileText size={20} />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-black text-white leading-snug">{att.name}</span>
            {att.token && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-mono font-black text-white">
                TOKEN: {att.token}
              </span>
            )}
          </div>
          {att.description && (
            <p className="text-[12px] text-white/60 mt-0.5 leading-relaxed">{att.description}</p>
          )}
          {att.url && (
            <span className="block text-[11px] text-white/40 truncate max-w-md mt-1 font-mono">
              {att.url}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {att.token && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(att.token!);
              showToast(`Token ${att.token} copiado para a área de transferência!`);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-[12px] font-black uppercase text-white hover:bg-white/20 transition"
          >
            <Copy size={13} />
            <span>Copiar {att.token}</span>
          </button>
        )}

        {att.url ? (
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[12px] font-black uppercase text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition"
          >
            <span>Acessar Material</span>
            <ExternalLink size={13} />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              const content = att.downloadContent || `PROJETO • MATERIAL DA AULA ${lesson.number}\n${att.name}`;
              const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = att.name;
              link.click();
              URL.revokeObjectURL(url);
              showToast(`Download de "${att.name}" iniciado!`);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-black uppercase text-black hover:bg-white/90 transition"
          >
            <Download size={13} />
            <span>Baixar Arquivo</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-fade-up max-w-[1440px] mx-auto">
      {/* ── Top Classroom Bar: Voltar + Breadcrumb + Ações ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[12px] font-bold text-white/80 hover:border-white/30 hover:text-white transition"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition text-white" />
            <span>Voltar aos Módulos</span>
          </button>

          <span className="hidden sm:inline-block text-[12px] text-white/30">/</span>
          <span className="hidden sm:inline-block text-[12px] font-semibold text-white/60 truncate max-w-xs">
            {lesson.moduleName}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Favorite button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(lesson.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isFavorite
                ? 'border-white/40 bg-white/15 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white'
            }`}
            title="Favoritar esta aula"
          >
            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Theater mode button */}
          <button
            type="button"
            onClick={() => setTheaterMode(!theaterMode)}
            className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-[12px] font-semibold text-white/60 hover:text-white transition"
          >
            {theaterMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{theaterMode ? 'Modo Normal' : 'Modo Cinema'}</span>
          </button>

          {/* Previous / Next buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-0.5">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && onSelectLesson(prevLesson)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition"
              title="Aula anterior"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="px-2 text-[11px] font-bold text-white/40">
              {currentIndex + 1}/{allLessons.length}
            </span>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && onSelectLesson(nextLesson)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition"
              title="Próxima aula"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Complete Lesson Button */}
          <button
            type="button"
            onClick={() => onToggleComplete(lesson.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] font-black transition-all active:scale-95 ${
              isCompleted
                ? 'border-[#22c55e]/40 bg-[#22c55e]/15 text-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'border-white/25 bg-white text-black hover:bg-white/90'
            }`}
          >
            {isCompleted ? <Check size={14} strokeWidth={3} /> : <CheckCircle2 size={14} />}
            <span>{isCompleted ? 'Aula Concluída' : 'Concluir Aula'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Stage Grid: Player & Sidebar ── */}
      <div className={`grid grid-cols-1 gap-6 ${theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'}`}>
        {/* Left Column: Player & Tab Content */}
        <div className={`space-y-6 ${theaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          {/* Cinema Video Player Container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#050507] shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
            {isPlaying && activeVideoUrl ? (
              isEmbed ? (
                <iframe
                  src={embedUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  autoPlay
                  onTimeUpdate={(e) => reportWatch(e.currentTarget)}
                  onPause={(e) => reportWatch(e.currentTarget, true)}
                  onEnded={() => onWatchProgress?.(lesson.id, 1)}
                  className="h-full w-full object-contain bg-black"
                />
              )
            ) : (
              /* Poster de Cinema com Play Transparente de Vidro */
              <div
                onClick={() => activeVideoUrl && setIsPlaying(true)}
                className="group relative flex h-full w-full flex-col items-center justify-center p-6 sm:p-8 text-center overflow-hidden cursor-pointer select-none"
              >
                <img
                  src={posterImage}
                  alt={lesson.title}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-35 filter contrast-125 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />

                <div className="relative z-10 flex flex-col items-center max-w-lg">
                  {/* Botão de Play Transparente de Vidro */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-black/50 shadow-[0_0_40px_rgba(255,255,255,0.2)] backdrop-blur-md mb-4 text-white group-hover:scale-110 group-hover:border-white group-hover:bg-white/15 transition-all duration-300">
                    <Play size={34} fill="white" className="ml-1 text-white" />
                  </div>

                  <span className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[10.5px] font-black uppercase tracking-widest text-white/80 mb-2 backdrop-blur-md">
                    AULA {lesson.number} • {lesson.moduleName}
                  </span>

                  <h2 className="text-[22px] sm:text-[28px] font-black tracking-tight text-white drop-shadow-lg">
                    {lesson.title}
                  </h2>

                  <p className="mt-1.5 text-[12.5px] text-white/60 line-clamp-2 leading-relaxed max-w-md">
                    Clique no play acima para iniciar a transmissão da aula em alta definição.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── DESTAQUE AUTOMÁTICO DE MATERIAL COMPLEMENTAR (SE A AULA TIVER LINKS/PROMPTS/TOKEN) ── */}
          {lesson.attachments.length > 0 && (
            <div className="rounded-[24px] border border-white/20 bg-gradient-to-br from-[#141418] via-[#0d0d10] to-[#08080a] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-white">
                  <Sparkles size={14} className="text-white" />
                  <span>Material Complementar Desta Aula</span>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                  Acesso Imediato
                </span>
              </div>
              <div className="space-y-3">
                {lesson.attachments.map((att) => renderAttachmentCard(att))}
              </div>
            </div>
          )}

          {/* ── Lesson Header Details (Título, Avaliação, Abas) ── */}
          <div className="rounded-[26px] border border-white/10 bg-[#0d0d10] p-6 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.85)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white/50 mb-1">
                  <span>AULA {lesson.number}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {lesson.duration}
                  </span>
                </div>
                <h1 className="text-[22px] sm:text-[26px] font-black text-white tracking-tight">
                  {lesson.title}
                </h1>
              </div>

              {/* Avaliação da Aula (5 Estrelas) */}
              <div className="flex items-center gap-1.5 shrink-0 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2">
                <span className="text-[11.5px] font-bold text-white/60 mr-1">Avaliar:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStarRating(s);
                      showToast(`Avaliação de ${s} estrelas salva! Obrigado pelo feedback.`);
                    }}
                    className="text-white hover:scale-110 transition"
                  >
                    <Star
                      size={16}
                      fill={s <= starRating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Abas da Aula */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
              {[
                { id: 'overview', label: 'Visão Geral & Ementa', icon: BookOpen },
                { id: 'materials', label: `Materiais Complementares (${lesson.attachments.length})`, icon: ExternalLink },
                { id: 'notes', label: 'Caderno de Anotações', icon: FileText },
                { id: 'comments', label: `Dúvidas & Comentários (${comments.length})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-extrabold transition ${
                      isActive
                        ? 'border border-white/30 bg-white/10 text-white'
                        : 'border border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ABA 1: VISÃO GERAL */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in text-[13.5px]">
                {/* Resumo */}
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-2">
                    Sobre Esta Aula
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {lesson.fullContent}
                  </p>
                </div>

                {/* O que você vai dominar */}
                {lesson.takeaways.length > 0 && (
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-3">
                      Pontos-Chave Desta Aula
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lesson.takeaways.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/40 p-3.5"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15 text-white text-[10.5px] font-black">
                            {idx + 1}
                          </div>
                          <span className="text-[12.5px] text-white/85 leading-snug">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist Prático de Execução */}
                {lesson.checklist.length > 0 && (
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-wider text-white/50 mb-3">
                      Checklist Prático (Clique para marcar as etapas)
                    </h3>
                    <div className="space-y-2">
                      {lesson.checklist.map((step, idx) => {
                        const isDone = checkedSteps[idx] || false;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleStep(idx)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-[13px] transition ${
                              isDone
                                ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-white line-through opacity-85'
                                : 'border-white/[0.06] bg-white/[0.02] text-white/80 hover:border-white/20'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare size={16} className="text-[#22c55e]" />
                              ) : (
                                <Square size={16} className="text-white/40" />
                              )}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: MATERIAIS COMPLEMENTARES */}
            {activeTab === 'materials' && (
              <div className="space-y-4 animate-fade-in">
                {lesson.attachments.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-6 text-center">
                    <p className="text-white/50 text-[13px]">
                      Nenhum material complementar externo necessário para esta aula.
                    </p>
                  </div>
                ) : (
                  lesson.attachments.map((att) => renderAttachmentCard(att))
                )}
              </div>
            )}

            {/* ABA 3: CADERNO DE ANOTAÇÕES */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-white">Suas Anotações Privativas</h4>
                    <p className="text-[11.5px] text-white/50">
                      O conteúdo é gravado automaticamente e fica disponível sempre que você voltar a esta aula.
                    </p>
                  </div>

                  {notes && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(notes);
                        showToast('Anotações copiadas para a área de transferência!');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-bold text-white/70 hover:text-white transition"
                    >
                      <Copy size={13} />
                      <span>Copiar</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Escreva aqui seus resumos, ideias de produtos, prompts personalizados e observações desta aula..."
                  rows={8}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 p-4 text-[13.5px] text-white placeholder-white/30 focus:border-white/40 focus:outline-none transition leading-relaxed"
                />
              </div>
            )}

            {/* ABA 4: COMENTÁRIOS E DÚVIDAS */}
            {activeTab === 'comments' && (
              <div className="space-y-6 animate-fade-in">
                {/* Input de Novo Comentário */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <div className="text-[13px] font-bold text-white">Deixe sua dúvida ou comentário</div>
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Escreva sua pergunta para os instrutores e colegas de turma..."
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 p-3.5 text-[13px] text-white placeholder-white/30 focus:border-white/40 focus:outline-none transition"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[12px] font-black uppercase text-black hover:bg-white/90 transition disabled:opacity-40"
                    >
                      <Send size={13} />
                      <span>Publicar Dúvida</span>
                    </button>
                  </div>
                </form>

                {/* Lista de Comentários */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  {comments.length === 0 ? (
                    <p className="text-white/40 text-[12.5px] py-2">
                      Seja o primeiro a deixar uma dúvida ou comentário sobre esta aula!
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-2xl border p-4 space-y-2 ${
                          c.isInstructor
                            ? 'border-white/20 bg-white/[0.04]'
                            : 'border-white/[0.06] bg-black/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                              {c.author.charAt(0)}
                            </div>
                            <span className="text-[13px] font-bold text-white">{c.author}</span>
                            {c.isInstructor && (
                              <span className="rounded-md bg-white px-2 py-0.5 text-[9.5px] font-black text-black">
                                INSTRUTOR
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/40">{c.timeAgo}</span>
                        </div>
                        <p className="text-[13px] text-white/80 pl-9 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Playlist Lateral Sanfonada por Módulos (4 cols) */}
        {!theaterMode && (
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-[#0d0d10] p-4 sm:p-5 shadow-[0_16px_45px_rgba(0,0,0,0.85)] sticky top-20">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-3">
                <span className="text-[14px] font-black text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-white" />
                  <span>Módulos & Aulas</span>
                </span>
                <span className="text-[11px] font-bold text-white/40">
                  {completedLessons.length}/{allLessons.length} Concluídas
                </span>
              </div>

              {/* Accordion List of Modules */}
              <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 mvz-scroll">
                {course.modules.map((mod) => {
                  const isExpanded = expandedModules[mod.id] || false;
                  const modCompletedCount = mod.lessons.filter((l) =>
                    completedLessons.includes(l.id)
                  ).length;
                  const modTotal = mod.lessons.length;

                  return (
                    <div
                      key={mod.id}
                      className="rounded-2xl border border-white/[0.06] bg-black/30 overflow-hidden"
                    >
                      {/* Module Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className="flex w-full items-center justify-between p-3.5 text-left hover:bg-white/[0.03] transition"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-white/50 block">
                            MÓDULO {mod.number}
                          </span>
                          <h4 className="text-[13px] font-bold text-white truncate">
                            {mod.title}
                          </h4>
                          <span className="text-[10.5px] text-white/40">
                            {modCompletedCount}/{modTotal} aulas concluídas
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-white/40 shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-white/40 shrink-0" />
                        )}
                      </button>

                      {/* Module Lessons List */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.04] p-1.5 space-y-1 bg-black/20">
                          {mod.lessons.map((item) => {
                            const isCurrent = item.id === lesson.id;
                            const itemDone = completedLessons.includes(item.id);
                            const hasMaterial = item.attachments && item.attachments.length > 0;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectLesson(item)}
                                className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left text-[12px] transition ${
                                  isCurrent
                                    ? 'bg-white/10 border border-white/30 text-white font-bold'
                                    : 'hover:bg-white/[0.05] text-white/70'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10.5px] font-bold ${
                                    isCurrent
                                      ? 'bg-white text-black'
                                      : itemDone
                                      ? 'bg-[#22c55e]/20 text-[#22c55e]'
                                      : 'bg-white/10 text-white/40'
                                  }`}
                                >
                                  {itemDone ? <Check size={12} strokeWidth={3} /> : item.number}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-semibold">{item.title}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                                    <span>{item.duration}</span>
                                    {hasMaterial && (
                                      <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-bold text-white/70">
                                        + Material
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0 animate-ping" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
