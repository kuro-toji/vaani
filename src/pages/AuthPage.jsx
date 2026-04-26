import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { signInWithEmail, verifyOTP, signOut, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  const handleSendOTP = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email);
      setSent(true);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError('');
    setSubmitting(true);
    try {
      await verifyOTP(email, otp);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--primary-muted)' }} />
    </div>
  );

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--bg-base)', padding: 'var(--sp-6)' }}
    >
      <div
        className="card animate-scaleIn"
        style={{ width: '100%', maxWidth: '400px' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              {[6, 10, 14, 10, 6].map((h, i) => (
                <rect key={i} x={i * 5} y={(20 - h) / 2} width={3} height={h} rx={1.5} fill="#1D9E75" />
              ))}
            </svg>
            <span className="font-bold text-lg" style={{
              background: 'linear-gradient(135deg, #00D4AA, #10B981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>VAANI</span>
          </div>
          <h1 className="font-semibold text-xl">Sign in to VAANI</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {step === 'email' ? 'Enter your email address' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* Email input */}
        {step === 'email' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
            )}

            <button
              onClick={handleSendOTP}
              disabled={submitting || !email.includes('@')}
              className="btn btn-primary w-full"
              style={{ height: '48px', fontSize: '15px' }}
            >
              {submitting ? 'Sending...' : 'Send OTP'}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
              By continuing, you agree to VAANI's Terms of Service and Privacy Policy
            </p>
          </div>
        )}

        {/* OTP input */}
        {step === 'otp' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              OTP sent to <strong>{email}</strong>
            </p>
            
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input
                  key={i}
                  type="tel"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = otp.split('').fill('', i, i + 1).join('');
                    const final = newOtp.slice(0, i) + val + newOtp.slice(i + 1);
                    setOtp(final.slice(0, 6));
                    if (val && i < 5) {
                      const next = document.querySelectorAll('input[maxLength="1"]')[i + 1];
                      next?.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      const prev = document.querySelectorAll('input[maxLength="1"]')[i - 1];
                      prev?.focus();
                    }
                    if (e.key === 'Enter') handleVerifyOTP();
                  }}
                  className="input text-center"
                  style={{ width: '48px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={submitting || otp.length !== 6}
              className="btn btn-primary w-full"
              style={{ height: '48px', fontSize: '15px' }}
            >
              {submitting ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="btn btn-ghost text-sm"
            >
              ← Change email address
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Didn't receive OTP?{' '}
              <button
                onClick={handleSendOTP}
                className="underline"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                Resend
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
