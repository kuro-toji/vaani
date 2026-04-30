// ═══════════════════════════════════════════════════════════════════
// VAANI — Standalone Cyberpunk Prototype
// Just HTML/CSS/JS in one file. No dependencies.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';

// ─── Colors ──────────────────────────────────────────────────────
const gold = '#D4AF37';
const goldLight = '#F5D76E';
const goldDark = '#B8960C';
const text = '#888888';
const bg = '#050505';

// ─── ASCII Logo ──────────────────────────────────────────────────
const ASCII = `
 ███╗   ██╗███████╗██╗   ██╗██████╗ ███████╗
 ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔════╝
 ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████╗
 ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗╚════██║
 ██║ ╚████║███████╗╚██████╔╝██║  ██║███████║
 ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
`.trim();

// ─── Particle Canvas ────────────────────────────────────────────
function Particles() {
  const canvas = useRef(null);
  
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    canvas.current.width = window.innerWidth;
    canvas.current.height = window.innerHeight;
    
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.current.width,
      y: Math.random() * canvas.current.height,
      s: Math.random() * 1.5 + 0.5,
      ox: (Math.random() - 0.5) * 0.2,
      oy: (Math.random() - 0.5) * 0.2,
      op: Math.random() * 0.4 + 0.1,
    }));
    
    let raf;
    let last = 0;
    
    function draw(t) {
      raf = requestAnimationFrame(draw);
      if (t - last < 8) return;
      last = t;
      
      ctx.fillStyle = 'rgba(5,5,5,0.08)';
      ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
      
      particles.forEach(p => {
        p.x += p.ox;
        p.y += p.oy;
        if (p.x < 0) p.x = canvas.current.width;
        if (p.x > canvas.current.width) p.x = 0;
        if (p.y < 0) p.y = canvas.current.height;
        if (p.y > canvas.current.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.op})`;
        ctx.fill();
      });
    }
    
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);
  
  return <canvas ref={canvas} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />;
}

// ─── Terminal ─────────────────────────────────────────────────────
function Terminal() {
  const [lines, setLines] = useState([]);
  const cmds = [
    '> vaani init --lang=hindi',
    '> Loading voice module... ✓',
    '> Analyzing portfolio...',
    '> Found: 2 FDs, 1 SIP',
    '> Calculating optimal ladder...',
    '> Suggestion: SBI + HDFC',
    '> Potential: ₹8,500/year',
    '> Ready.',
  ];
  
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < cmds.length) setLines(p => [...p, cmds[i++]]);
      else clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div style={{ 
      background: '#0a0a0a', 
      border: `1px solid ${gold}33`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{ 
        display: 'flex', gap: 6, padding: '12px 16px',
        background: '#111', borderBottom: `1px solid ${gold}33`
      }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: text }}>vaani://terminal</span>
      </div>
      <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.startsWith('>') ? gold : text }}>{l}</div>
        ))}
        {lines.length < cmds.length && <span style={{ color: gold }}>█</span>}
      </div>
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────
function Card({ icon, title, desc }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 24,
        borderRadius: 16,
        background: hover ? `linear-gradient(135deg, ${gold}10, transparent)` : 'transparent',
        border: `1px solid ${hover ? gold : gold}33`,
        transition: 'all 0.3s',
        boxShadow: hover ? `0 0 30px ${gold}20` : 'none',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: gold, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

// ─── Lang Selector ────────────────────────────────────────────────
const LANGS = ['हिंदी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'English'];

function Langs() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {LANGS.map((l, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            background: active === i ? gold : 'transparent',
            color: active === i ? bg : text,
            border: `1px solid ${active === i ? gold : gold}33`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────
function Btn({ children, outline, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 32px',
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 15,
        background: outline ? 'transparent' : `linear-gradient(135deg, ${goldDark}, ${gold}, ${goldLight})`,
        color: outline ? gold : bg,
        border: outline ? `1px solid ${gold}` : 'none',
        boxShadow: outline ? 'none' : `0 0 30px ${gold}40`,
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff' }}>
      <style>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px ${gold}; }
          50% { text-shadow: 0 0 30px ${gold}, 0 0 60px ${gold}60; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
      
      <Particles />
      
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${gold}33`,
        padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: gold, letterSpacing: '0.3em' }}>[ VAANI ]</span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 13, color: text, textDecoration: 'none' }}>Features</a>
          <a href="#demo" style={{ fontSize: 13, color: text, textDecoration: 'none' }}>Demo</a>
          <Btn onClick={() => {}}>Get Started</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '80px 24px 24px',
      }}>
        <pre style={{
          fontFamily: 'monospace', lineHeight: 1.2, color: gold,
          textShadow: `0 0 10px ${gold}, 0 0 20px ${gold}40`,
          fontSize: 'clamp(0.25rem, 0.8vw, 0.55rem)',
        }}>
          {ASCII}
        </pre>
        
        <h1 style={{
          fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 500, marginTop: 32,
          animation: 'glow 4s ease-in-out infinite',
        }}>
          India's Voice-First Financial Advisor
        </h1>
        
        <p style={{ fontSize: 15, color: text, maxWidth: 480, marginTop: 16, lineHeight: 1.6 }}>
          Manage wealth with your voice. Hindi, regional languages, or English.
        </p>
        
        <p style={{ fontSize: 11, color: gold, letterSpacing: '0.2em', marginTop: 32, textTransform: 'uppercase' }}>
          Select Language
        </p>
        <div style={{ marginTop: 12 }}><Langs /></div>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          <Btn>Start Free Trial →</Btn>
          <Btn outline>See Demo</Btn>
        </div>
      </section>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
        maxWidth: 800, margin: '0 auto', padding: '48px 24px',
        borderTop: `1px solid ${gold}33`, borderBottom: `1px solid ${gold}33`,
        textAlign: 'center',
      }}>
        {[['2.5L+', 'Users'], ['₹500Cr+', 'Managed'], ['22', 'Languages']].map(([v, l], i) => (
          <div key={i}>
            <div style={{ fontSize: 36, fontWeight: 700, color: gold, textShadow: `0 0 20px ${gold}40` }}>{v}</div>
            <div style={{ fontSize: 11, color: text, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Built for <span style={{ color: gold }}>India.</span>
          </h2>
          <p style={{ fontSize: 14, color: text, textAlign: 'center', marginBottom: 48 }}>
            Powerful tools for everyone.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Card icon="🎤" title="Voice Interface" desc="Speak naturally in 22 languages. No keyboard needed." />
            <Card icon="🏦" title="Smart FD Planner" desc="Maximize returns with intelligent FD laddering." />
            <Card icon="📊" title="Portfolio Track" desc="FDs, SIPs, gold, crypto — all in one place." />
            <Card icon="🤖" title="AI Advisor" desc="Personalized advice based on your profile." />
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" style={{ padding: '80px 24px', background: 'rgba(10,10,10,0.5)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            <span style={{ color: gold }}>See it live</span>
          </h2>
          <p style={{ fontSize: 14, color: text, marginBottom: 32 }}>Type less. Speak more.</p>
          <Terminal />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <pre style={{
          fontFamily: 'monospace', lineHeight: 1.2, color: gold,
          textShadow: `0 0 10px ${gold}`,
          fontSize: 'clamp(0.25rem, 0.8vw, 0.55rem)',
        }}>{ASCII}</pre>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 24 }}>Ready to begin?</h2>
        <p style={{ fontSize: 14, color: text, marginTop: 8, marginBottom: 24 }}>Free forever. No credit card.</p>
        <Btn>Get Started Free →</Btn>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px', borderTop: `1px solid ${gold}33`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: gold, letterSpacing: '0.2em' }}>VAANI v2.0</span>
        <span style={{ fontSize: 12, color: text }}>© 2026 Made in India</span>
      </footer>
    </div>
  );
}
