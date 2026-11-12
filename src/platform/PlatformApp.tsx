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
import { HooksView } from './views/HooksView';
import { HeadlinesView } from './views/HeadlinesView';
import { MotionExtractorView } from './views/MotionExtractorView';
import { TurboView } from './views/TurboView';
import { JourneyView } from './views/JourneyView';
import { AutomationsView } from './views/AutomationsView';
import { CommunityView, CreditsView, HelpView } from './views/MiscViews';
import { SupportChatView } from './views/SupportChatView';
import { LoginView } from './views/LoginView';

const VALID: ViewId[] = [
  'home',
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

  // User Profile state with persistence & instant event sync
  const { profile, saveProfile: handleSaveProfile } = useUserProfile();

  const navigate = useCallback((v: ViewId) => {
    setView(v);
    window.location.hash = `#/${v}`;
    document.getElementById('mvz-main')?.scrollTo({ top: 0 });
  }, []);

  const handleLogin = useCallback((_email: string) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('orbiex_auth', 'true');
      localStorage.setItem('orbix_auth', 'true');
    } catch {}
    navigate('home');
  }, [navigate]);

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
      if (window.location.hash === '#/login') {
        setIsAuthenticated(false);
      } else {
        setView(fromHash());
      }
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
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
            {view === 'agent' && <AgentView seed={seed} onSeedUsed={clearSeed} startNew={startNew} onStarted={clearStartNew} />}
            {view === 'journey' && <JourneyView onUse={useInAgent} />}
            {view === 'products' && <WinningProductsView onUseInAgent={useInAgent} onNavigate={navigate} />}
            {view === 'product' && <ProductScoreView onUseInAgent={useInAgent} />}
            {view === 'store' && <StoreScoreView onUseInAgent={useInAgent} />}
            {view === 'scanner' && <ScannerView onUseInAgent={useInAgent} />}
            {view === 'prompts' && <PromptsView onUse={useInAgent} />}
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
