import React, { Component, type ReactNode, useState, useEffect } from 'react';
import PlatformApp from './platform/PlatformApp';
import CourseMembersApp from './course-members/CourseMembersApp';
import SelectedOnboardingApp from './selected/SelectedOnboardingApp';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            Atualizando plataforma...
          </h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
            Clique abaixo para recarregar a Orbiex.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#d4af37',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [routeState, setRouteState] = useState(() => ({
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
  }));

  useEffect(() => {
    const syncRoute = () =>
      setRouteState({
        hash: window.location.hash,
        pathname: window.location.pathname,
      });
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const lowerHash = routeState.hash.toLowerCase();
  const lowerPath = routeState.pathname.toLowerCase();

  const isSelectedPage =
    lowerPath.startsWith('/selecionado') ||
    lowerPath.startsWith('/aprovado') ||
    lowerPath.startsWith('/gerente') ||
    lowerPath.startsWith('/convocacao') ||
    lowerHash.startsWith('#/selecionado') ||
    lowerHash.startsWith('#/aprovado') ||
    lowerHash.startsWith('#/gerente') ||
    lowerHash.startsWith('#/convocacao');

  const isCourseStandalone =
    lowerHash.startsWith('#/curso') ||
    lowerHash.startsWith('#/formacao') ||
    lowerPath.startsWith('/curso') ||
    lowerPath.startsWith('/formacao');

  return (
    <ErrorBoundary>
      {isSelectedPage ? (
        <SelectedOnboardingApp />
      ) : isCourseStandalone ? (
        <CourseMembersApp />
      ) : (
        <PlatformApp />
      )}
    </ErrorBoundary>
  );
}
