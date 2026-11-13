import { useCallback, useEffect, useState } from 'react';
import './platform.css';
import type { ViewId } from './data';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { useUserProfile } from './useUserProfile';
import { HomeView } from './views/HomeView';
import { AgentView } from './views/AgentView';
import { WinningProductsView } from './views/WinningProductsView';
import { ProductScoreView } from './views/ProductScoreView';
import { StoreScoreView } from './views/StoreScoreView';
import { ScannerView } from './views/ScannerView';
import { PromptsView } from './views/PromptsView';
import { PromptGeneratorView } from './views/PromptGeneratorView';
import { AntiRestrictionView } from './views/AntiRestrictionView';
import { HooksView } from './views/HooksView';
import { HeadlinesView } from './views/HeadlinesView';
import { MotionExtractorView } from './views/MotionExtractorView';
import { TurboView } from './views/TurboView';
import { JourneyView } from './views/JourneyView';
import { AutomationsView } from './views/AutomationsView';
import { CommunityView, CreditsView, HelpView } from './views/MiscViews';
import { SupportChatView } from './views/SupportChatView';
import { LoginView } from './views/LoginView';
import { AccessInstructionsView } from './views/AccessInstructionsView';
import { MembersView } from './views/MembersView';

const VALID: ViewId[] = [
  'home',
  'members',
  'agent',
  'journey',
  'products',
  'product',
  'store',
  'scanner',
  'motion',
  'turbo',
  'headlines',
  'hooks',
  'prompts',
  'prompt-gen',
  'antirestriction',
  'automations',
  'credits',
  'community',
  'support',
  'help',
];

const fromHash = (): ViewId => {
  const h = window.location.hash.replace('#/', '') as ViewId;
  return VALID.includes(h) ? h : 'home';
};

export default function PlatformApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (window.location.hash === '#/login') return false;
      return (
        localStorage.getItem('orbiex_auth') === 'true' ||
        localStorage.getItem('orbix_auth') === 'true'
      );
    } catch {
      return false;
    }
  });

  const [view, setView] = useState<ViewId>(fromHash);
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [seed, setSeed] = useState<string>();
  const [startNew, setStartNew] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [showingInstructions, setShowingInstructions] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return (
      p.includes('acesso') ||
      p.includes('instrucoes') ||
      p.includes('boas-vindas') ||
      h.includes('acesso') ||
      h.includes('instrucoes') ||
      h.includes('boas-vindas')
    );
  });

  // User Profile state with persistence & instant event sync
  const { profile, saveProfile: handleSaveProfile } = useUserProfile();

  const navigate = useCallback((v: ViewId) => {
    setView(v);
    window.location.hash = `#/${v}`;
    document.getElementById('mvz-main')?.scrollTo({ top: 0 });
  }, []);

  const handleLogin = useCallback((email: string, name?: string) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('orbiex_auth', 'true');
      localStorage.setItem('orbix_auth', 'true');
      localStorage.setItem('orbiex_user_email', email);
      localStorage.setItem('orbix_user_email', email);
      if (name) {
        handleSaveProfile({ ...profile, name });
      }
    } catch {}
    navigate('home');
  }, [navigate, handleSaveProfile, profile]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('orbiex_auth');
      localStorage.removeItem('orbix_auth');
    } catch {}
    setIsAuthenticated(false);
    window.location.hash = '#/login';
  }, []);

  useEffect(() => {
    const h = () => {
      const p = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (
        p.includes('acesso') ||
        p.includes('instrucoes') ||
        p.includes('boas-vindas') ||
        hash.includes('acesso') ||
        hash.includes('instrucoes') ||
        hash.includes('boas-vindas')
      ) {
        setShowingInstructions(true);
      } else if (window.location.hash === '#/login') {
        setShowingInstructions(false);
        setIsAuthenticated(false);
      } else {
        setShowingInstructions(false);
        setView(fromHash());
      }
    };
    window.addEventListener('hashchange', h);
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('hashchange', h);
      window.removeEventListener('popstate', h);
    };
  }, []);

  const useInAgent = useCallback(
    (text: string) => {
      setSeed(text);
      navigate('agent');
    },
    [navigate],
  );

  const clearSeed = useCallback(() => setSeed(undefined), []);

  const newChat = () => {
    setStartNew(true);
    navigate('agent');
  };
  const clearStartNew = useCallback(() => setStartNew(false), []);

  if (showingInstructions) {
    return (
      <AccessInstructionsView
        onGoToLogin={() => {
          setShowingInstructions(false);
          setIsAuthenticated(false);
          window.location.hash = '#/login';
          if (window.location.pathname !== '/') {
            try {
              window.history.pushState({}, '', '/#/login');
            } catch {}
          }
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="mvz flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={navigate}
        open={menu}
        onClose={() => setMenu(false)}
        profile={profile}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          view={view}
          onMenu={() => setMenu(true)}
          onSearch={() => setPalette(true)}
          onNewChat={newChat}
          profile={profile}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main id="mvz-main" className="mvz-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
            {view === 'home' && <HomeView go={navigate} />}
            {view === 'members' && <MembersView onNavigate={navigate} />}
            {view === 'agent' && <AgentView seed={seed} onSeedUsed={clearSeed} startNew={startNew} onStarted={clearStartNew} />}
            {view === 'journey' && <JourneyView onUse={useInAgent} />}
            {view === 'products' && <WinningProductsView onUseInAgent={useInAgent} onNavigate={navigate} />}
            {view === 'product' && <ProductScoreView onUseInAgent={useInAgent} />}
            {view === 'store' && <StoreScoreView onUseInAgent={useInAgent} />}
            {view === 'scanner' && <ScannerView onUseInAgent={useInAgent} />}
            {view === 'prompts' && <PromptsView onUse={useInAgent} />}
            {view === 'prompt-gen' && <PromptGeneratorView onUseInAgent={useInAgent} onNavigate={navigate} />}
            {view === 'antirestriction' && <AntiRestrictionView />}
            {view === 'headlines' && <HeadlinesView onUse={useInAgent} />}
            {view === 'hooks' && <HooksView onUse={useInAgent} />}
            {view === 'motion' && <MotionExtractorView onUse={useInAgent} />}
            {view === 'turbo' && <TurboView onUse={useInAgent} />}
            {view === 'automations' && <AutomationsView />}
            {view === 'credits' && <CreditsView />}
            {view === 'community' && <CommunityView />}
            {view === 'support' && <SupportChatView onNavigate={navigate} onUseInAgent={useInAgent} />}
            {view === 'help' && <HelpView mode="help" />}
          </div>
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} onNavigate={navigate} onPrompt={useInAgent} />

      <ProfileSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />
    </div>
  );
}
