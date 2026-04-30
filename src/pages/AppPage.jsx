import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import Dashboard from '../components/dashboard/Dashboard.jsx';

export default function AppPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--gold)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Loading VAANI...</span>
      </div>
    </div>
  );

  return (
    <ChatProvider>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>

        {/* ─── TOP BAR ─── */}
        <header style={{
          height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
          background: 'rgba(12,12,14,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 300, letterSpacing: '0.1em' }}>
              VA<span style={{ color: 'var(--gold)' }}>A</span>NI
            </span>
            <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderLeft: '1px solid var(--line)', paddingLeft: '12px' }}>
              Dashboard
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Demo Button */}
            <button onClick={() => navigate('/demo')} style={{
              background: 'transparent', border: '1px solid var(--line)', color: 'var(--gold)',
              padding: '6px 16px', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
            >
              Demo
            </button>

            {/* Chat Toggle */}
            <button onClick={() => setChatOpen(!chatOpen)} style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: chatOpen ? 'var(--gold)' : 'rgba(201,168,76,0.12)',
              border: '1px solid var(--line)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s', position: 'relative',
            }}>
              {chatOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              )}
              {!chatOpen && (
                <div style={{
                  position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px',
                  borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-base)',
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
              )}
            </button>
          </div>
        </header>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* Dashboard — full width */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Dashboard />
          </div>

          {/* Chat Drawer — slides from right */}
          <div style={{
            position: 'fixed', top: '56px', right: 0, bottom: 0,
            width: chatOpen ? '400px' : '0px',
            maxWidth: '100vw',
            overflow: 'hidden',
            transition: 'width 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 40,
            borderLeft: chatOpen ? '1px solid var(--border-subtle)' : 'none',
            background: 'var(--bg-base)',
          }}>
            {chatOpen && (
              <div style={{ width: '400px', height: '100%' }}>
                <ChatWindow onClose={() => setChatOpen(false)} />
              </div>
            )}
          </div>

          {/* Backdrop on mobile */}
          {chatOpen && (
            <div onClick={() => setChatOpen(false)} style={{
              position: 'fixed', inset: 0, top: '56px',
              background: 'rgba(0,0,0,0.5)', zIndex: 35,
              display: 'none',
            }} className="md-backdrop" />
          )}
        </div>
      </div>
    </ChatProvider>
  );
}