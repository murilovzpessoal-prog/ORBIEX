import { useState, useMemo } from 'react';
import { COURSE_DATA, INITIAL_USER } from './mockData';
import type { Lesson, UserAccount } from './types';
import { LoginView } from './LoginView';
import { Navbar } from './Navbar';
import { CourseDashboard } from './CourseDashboard';
import { ClassroomView } from './ClassroomView';
import { CertificateModal } from './CertificateModal';
import { Sparkles } from 'lucide-react';

export default function CourseMembersApp() {
  // Autenticação oficial: todo visitante cai obrigatoriamente na tela de Login/Cadastro
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('projeto_member_authenticated');
      // Apenas quem já fez login entra direto; novos visitantes caem na tela de login
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<UserAccount>(() => {
    try {
      const stored = localStorage.getItem('projeto_member_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'classroom'>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistence: Completed Lessons
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('projeto_completed_lessons_v3');
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      // Remove a aula marcada como concluída por padrão nas versões antigas (não foi assistida)
      const hasWatchData = !!localStorage.getItem('projeto_watch_progress_v1');
      if (!hasWatchData && parsed.length === 1 && parsed[0] === 'l-1-1') return [];
      return parsed;
    } catch {
      return [];
    }
  });

  // Quanto de cada aula já foi assistido (0 a 1), usado na porcentagem de progresso
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('projeto_watch_progress_v1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persistence: Favorite Lessons
  const [favoriteLessons, setFavoriteLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('projeto_favorite_lessons_v3');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persistence: Custom Video URLs
  const [customVideos, setCustomVideos] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('projeto_custom_videos_v3');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Capas travadas: as 15 capas oficiais vêm somente dos arquivos do projeto
  // (public/assets/capas-modulos). Nada salvo no navegador substitui essas capas.
  const [customModuleCovers, setCustomModuleCovers] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleLogin = (email: string, name?: string) => {
    const updatedUser: UserAccount = {
      ...user,
      email,
      name: name || user.name,
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('projeto_member_authenticated', 'true');
      localStorage.setItem('projeto_member_user', JSON.stringify(updatedUser));
    } catch {}
    showToast(`Bem-vindo, ${updatedUser.name}!`);
  };

  const handleChangeAvatar = (dataUrl: string | null) => {
    const updatedUser: UserAccount = { ...user, avatarUrl: dataUrl || undefined };
    setUser(updatedUser);
    try {
      localStorage.setItem('projeto_member_user', JSON.stringify(updatedUser));
      showToast(dataUrl ? 'Foto de perfil atualizada!' : 'Foto de perfil removida.');
    } catch {
      showToast('Foto aplicada, mas não foi possível salvá-la neste navegador.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('projeto_member_authenticated', 'false');
    } catch {}
    showToast('Você saiu da sua conta.');
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('projeto_completed_lessons_v3', JSON.stringify(updated));
      } catch {}
      showToast(
        updated.includes(lessonId)
          ? 'Aula marcada como concluída! Parabéns 🚀'
          : 'Aula desmarcada.'
      );
      return updated;
    });
  };

  const handleToggleFavorite = (lessonId: string) => {
    setFavoriteLessons((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('projeto_favorite_lessons_v3', JSON.stringify(updated));
      } catch {}
      showToast(
        updated.includes(lessonId)
          ? 'Aula adicionada aos favoritos ⭐'
          : 'Aula removida dos favoritos'
      );
      return updated;
    });
  };

  const handleSaveCustomVideo = (lessonId: string, url: string) => {
    const updated = { ...customVideos, [lessonId]: url };
    setCustomVideos(updated);
    try {
      localStorage.setItem('projeto_custom_videos_v3', JSON.stringify(updated));
    } catch {}
  };

  const handleSaveModuleCover = (moduleId: string, dataUrl: string) => {
    const updated = { ...customModuleCovers, [moduleId]: dataUrl };
    setCustomModuleCovers(updated);
    try {
      localStorage.setItem('projeto_custom_module_covers', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar capa do módulo:', e);
    }
    showToast('Foto da capa do módulo atualizada!');
  };

  const handleResetModuleCover = (moduleId: string) => {
    const updated = { ...customModuleCovers };
    delete updated[moduleId];
    setCustomModuleCovers(updated);
    try {
      localStorage.setItem('projeto_custom_module_covers', JSON.stringify(updated));
    } catch {}
    showToast('Capa do módulo restaurada para a original!');
  };

  const handleResetProgress = () => {
    setCompletedLessons([]);
    setWatchProgress({});
    try {
      localStorage.setItem('projeto_completed_lessons_v3', JSON.stringify([]));
      localStorage.setItem('projeto_watch_progress_v1', JSON.stringify({}));
    } catch {}
    showToast('Progresso das aulas zerado.');
  };

  // Recebe do player o quanto da aula foi assistido; ao passar de 90% a aula é concluída sozinha
  const handleWatchProgress = (lessonId: string, fraction: number) => {
    const value = Math.min(1, Math.max(0, fraction));
    setWatchProgress((prev) => {
      if ((prev[lessonId] || 0) >= value) return prev;
      const updated = { ...prev, [lessonId]: value };
      try {
        localStorage.setItem('projeto_watch_progress_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (value >= 0.9) {
      setCompletedLessons((prev) => {
        if (prev.includes(lessonId)) return prev;
        const updated = [...prev, lessonId];
        try {
          localStorage.setItem('projeto_completed_lessons_v3', JSON.stringify(updated));
        } catch {}
        showToast('Aula concluída! Seu progresso foi atualizado 🚀');
        return updated;
      });
    }
  };

  const allLessons = useMemo(() => {
    return COURSE_DATA.modules.flatMap((m) => m.lessons);
  }, []);

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessons.length;
  // Aula concluída conta 100%; aula em andamento conta o quanto já foi assistido
  const progressPercentage = useMemo(() => {
    if (totalLessonsCount === 0) return 0;
    const watched = allLessons.reduce(
      (sum, l) => sum + (completedLessons.includes(l.id) ? 1 : Math.min(watchProgress[l.id] || 0, 1)),
      0
    );
    return Math.round((watched / totalLessonsCount) * 100);
  }, [allLessons, completedLessons, watchProgress, totalLessonsCount]);

  // Se o aluno não estiver autenticado, exibe a página de login exclusiva
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans antialiased selection:bg-[var(--mvz-gold)] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--mvz-gold)]/40 bg-[#12100d] px-4 py-3 text-[13px] font-bold text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <Sparkles size={16} className="text-[var(--mvz-gold)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Certificate Modal */}
      {certificateOpen && (
        <CertificateModal user={user} onClose={() => setCertificateOpen(false)} />
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        progressPercentage={progressPercentage}
        completedLessonsCount={completedLessonsCount}
        totalLessonsCount={totalLessonsCount}
        currentView={currentView}
        onNavigateHome={handleBackToDashboard}
        onOpenCertificate={() => setCertificateOpen(true)}
        onLogout={handleLogout}
        onChangeAvatar={handleChangeAvatar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lessons={allLessons}
        completedLessons={completedLessons}
        onSelectLesson={handleSelectLesson}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === 'dashboard' ? (
          <CourseDashboard
            course={COURSE_DATA}
            user={user}
            completedLessons={completedLessons}
            customModuleCovers={customModuleCovers}
            onSaveModuleCover={handleSaveModuleCover}
            onResetModuleCover={handleResetModuleCover}
            onSelectLesson={handleSelectLesson}
            onOpenCertificate={() => setCertificateOpen(true)}
            onResetProgress={handleResetProgress}
            searchQuery={searchQuery}
          />
        ) : (
          selectedLesson && (
            <ClassroomView
              course={COURSE_DATA}
              lesson={selectedLesson}
              completedLessons={completedLessons}
              favoriteLessons={favoriteLessons}
              customVideos={customVideos}
              onSelectLesson={handleSelectLesson}
              onToggleComplete={handleToggleComplete}
              onWatchProgress={handleWatchProgress}
              onToggleFavorite={handleToggleFavorite}
              onSaveCustomVideo={handleSaveCustomVideo}
              onBackToDashboard={handleBackToDashboard}
              showToast={showToast}
            />
          )
        )}
      </main>
    </div>
  );
}
