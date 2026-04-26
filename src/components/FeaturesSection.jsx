import { useEffect, useRef, useState } from 'react';

const CARDS = [
  {
    icon: '🗣️',
    title: 'Dialect AI — Bhojpuri, Maithili, Awadhi',
    desc: 'Not just Hindi translation — authentic street dialect of Purvanchal, Mithila, and Awadh. The first fintech app that speaks like your village elder, not a bank manager.',
    quote: '"Aapka galla band ho gaya — paisa surakshit ba" — Gorakhpur dialect',
  },
  {
    icon: '💍',
    title: 'Life-Event FD Alignment',
    desc: 'VAANI detects from your conversation that a wedding is 8 months away and auto-structures your FD to mature exactly then — no financial planning degree required.',
    quote: '"Shaadi ke liye paisa ek dum sahi waqt pe milega" — VAANI',
  },
  {
    icon: '🏦',
    title: 'FD Ladder + TDS Harvest',
    desc: 'Splits ₹10,000 across staggered FDs across Suryoday, Utkarsh, Jana — institutional wealth management strategy, now available to a kirana shop owner in Gorakhpur.',
    quote: 'Saves ₹840 TDS annually on ₹1L investment',
  },
  {
    icon: '🧠',
    title: 'Emotional State Detection',
    desc: 'When VAANI detects anxiety in your words — "paisa doob jayega kya?" — it switches to full village-metaphor mode. When calm, it gives precise numbers.',
    quote: '"Dar mat, yeh galla band hai — bank ki tijori jaisa" — anxiety mode',
  },
  {
    icon: '🌍',
    title: 'Hyperlocal Social Proof',
    desc: 'Real-time counts of investors from your specific city. Not national numbers — your neighbourhood\'s trust score.',
    quote: '"17,832 log Gorakhpur se Suryoday mein paisa lagaye hain"',
  },
];

function FeatureCard({ card, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 100);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      style={{
        background: '#0F2E2B',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease-out ${index * 100}ms, transform 0.5s ease-out ${index * 100}ms`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '28px' }}>{card.icon}</span>
      <h4 style={{
        color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0,
        fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
        lineHeight: 1.3,
      }}>{card.title}</h4>
      <p style={{
        color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.7,
        margin: 0, flex: 1,
      }}>{card.desc}</p>
      <p style={{
        color: '#FF6B00', fontSize: '12px', fontStyle: 'italic', margin: 0,
        fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
        lineHeight: 1.5,
      }}>{card.quote}</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section style={{
      background: '#061A1A',
      padding: '80px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '2px',
            textTransform: 'uppercase', margin: '0 0 8px',
          }}>Why VAANI</p>
          <h2 style={{
            color: '#fff', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800,
            margin: 0, fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
          }}>
            Built different. Built for Bharat.
          </h2>
        </div>

        <div
          className="features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {CARDS.map((card, i) => (
            <FeatureCard key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}