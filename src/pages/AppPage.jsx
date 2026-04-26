import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import Dashboard from '../components/dashboard/Dashboard.jsx';

/**
 * AppPage — Main authenticated view.
 * Desktop: 40% chat (left) + 60% dashboard (right), side by side.
 * Mobile: Tab bar at bottom — [Chat] [Dashboard].
 */
export default function AppPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--primary-muted)' }} />
    </div>
  );

  return (
    <ChatProvider>
      <div
        style={{ height: '100dvh', display: 'flex', overflow: 'hidden' }}
      >
        {/* Desktop: Side-by-side split */}
        <div className="hidden lg:flex flex-1 overflow-hidden"
          style={{ height: '100%', alignItems: 'stretch' }}>
          {/* Chat panel — 40% */}
          <div
            className="flex flex-col overflow-hidden"
            style={{
              width: '40%',
              minWidth: '340px',
              maxWidth: '520px',
              height: '100%',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            <ChatWindow />
          </div>

          {/* Dashboard panel — 60% */}
          <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)', height: '100%', minHeight: 0 }}>
            <Dashboard />
          </div>
        </div>

        {/* Mobile: Tab-based navigation */}
        <MobileApp />
      </div>
    </ChatProvider>
  );
}

/** Mobile layout: full-screen with bottom tab bar */
function MobileApp() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex flex-col lg:hidden flex-1 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full">
            <ChatWindow onClose={() => setActiveTab('dashboard')} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <Dashboard />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div
        className="flex"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(8,8,8,0.95)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <TabButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          }
          label="Chat"
        />
        <TabButton
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
            </svg>
          }
          label="Dashboard"
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-3 touch-target"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? 'var(--primary)' : 'var(--text-tertiary)',
        transition: 'color 0.2s',
      }}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}