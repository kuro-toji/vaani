import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Wallet, Target, MessageCircle, TrendingUp, Receipt, Settings, User } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,          label: 'Dashboard',    sub: 'डैशबोर्ड' },
  { icon: Wallet,         label: 'My FDs',       sub: 'मेरी FD' },
  { icon: Target,         label: 'Goals',         sub: 'लक्ष्य' },
  { icon: MessageCircle,  label: 'VAANI Chat',   sub: 'वाणी से बात' },
  { icon: TrendingUp,     label: 'Spending',      sub: 'खर्च' },
  { icon: Receipt,         label: 'Tax Corner',    sub: 'टैक्स' },
  { icon: Settings,        label: 'Settings',     sub: 'सेटिंग्स' },
];

const USER = {
  name: 'Ramesh Kumar',
  lang: 'Bhojpuri',
  region: 'Uttar Pradesh',
  initials: 'RK',
};

const SIDEBAR_BANK_COLORS = {
  Suryoday: '#FF6B00',
  Utkarsh:  '#1D9E75',
  Jana:     '#534AB7',
};

export default function Sidebar({ active = 'Dashboard', onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'rgba(10,30,30,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        padding: '0 0 20px',
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF6B00, #E55A00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800, color: '#fff',
          }}>व</div>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>VAANI</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: isActive ? 'rgba(255,107,0,0.15)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  width: '100%', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} color={isActive ? '#FF6B00' : 'rgba(255,255,255,0.5)'} />
                <div>
                  <div style={{ color: isActive ? '#FF6B00' : 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{item.sub}</div>
                </div>
                {isActive && (
                  <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: '#FF6B00' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{USER.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{USER.name}</div>
            <div style={{ color: '#FF6B00', fontSize: '11px' }}>{USER.lang} · {USER.region}</div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,30,30,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 0 env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.label)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  padding: '4px 12px',
                }}
              >
                <Icon size={20} color={isActive ? '#FF6B00' : 'rgba(255,255,255,0.4)'} />
                <span style={{ color: isActive ? '#FF6B00' : 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .bottom-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}