import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import StatCards from '../components/dashboard/StatCards';
import FDLadderTimeline from '../components/dashboard/FDLadderTimeline';
import MiniChat from '../components/dashboard/MiniChat';
import SpendingDonut from '../components/dashboard/SpendingDonut';
import GoalsSection from '../components/dashboard/GoalsSection';

function DashboardContent() {
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#061A1A',
      display: 'flex',
      fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
    }}>
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '24px 28px 100px',
        overflowY: 'auto',
        maxWidth: '100%',
      }}>
        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            color: '#fff', fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 800, margin: 0, lineHeight: 1.2,
          }}>
            Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
            डैशबोर्ड · Ramesh Kumar, Bhojpuri · UP
          </p>
        </div>

        {/* Section 1: Stat cards */}
        <StatCards />

        {/* Section 2: FD Ladder Timeline */}
        <div style={{ marginTop: '20px' }}>
          <FDLadderTimeline />
        </div>

        {/* Section 3: Two-column — Chat + Spending */}
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}>
          <MiniChat onOpenFull={() => {}} />
          <SpendingDonut />
        </div>

        {/* Section 4: Goals */}
        <div style={{ marginTop: '20px' }}>
          <GoalsSection />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { padding: 16px 16px 100px !important; }
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardContent />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}