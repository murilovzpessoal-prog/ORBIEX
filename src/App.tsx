import React, { Component, type ReactNode, useState, useEffect } from 'react';
import PlatformApp from './platform/PlatformApp';
import CourseMembersApp from './course-members/CourseMembersApp';

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
  const [route, setRoute] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const isCourseStandalone = route.startsWith('#/curso') || route.startsWith('#/formacao');

  return (
    <ErrorBoundary>
      {isCourseStandalone ? <CourseMembersApp /> : <PlatformApp />}
    </ErrorBoundary>
  );
}
