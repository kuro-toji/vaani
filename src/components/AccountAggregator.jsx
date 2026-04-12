import { useState } from 'react';
import { getBanksList, verifyOTP, fetchAccountData, analyzePortfolio } from '../services/aaService.js';

/**
 * AccountAggregator — Multi-step consent flow simulating India's AA framework.
 * Steps: Select Bank → OTP → Consent → Fetching → Results
 */
export default function AccountAggregator({ onClose, onDataFetched }) {
  const [step, setStep] = useState('select'); // select, otp, consent, fetching, results
  const [selectedBank, setSelectedBank] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const banks = getBanksList();

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep('otp');
  };

  const handleOtpSubmit = () => {
    if (verifyOTP(otp)) {
      setOtpError('');
      setStep('consent');
    } else {
      setOtpError('6 अंक का OTP डालें');
    }
  };

  const handleConsent = async () => {
    setStep('fetching');
    const data = await fetchAccountData(selectedBank.id);
    const recs = analyzePortfolio(data);
    setPortfolio(data);
    setRecommendations(recs);
    setStep('results');
    if (onDataFetched) onDataFetched(data);
  };

  const cardStyle = {
    background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '460px',
    width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '85vh', overflow: 'auto',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            🔗 Account Aggregator
          </h2>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', width: '36px', height: '36px',
            borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Step: Select Bank */}
        {step === 'select' && (
          <>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              अपना बैंक चुनें — AA फ्रेमवर्क से सुरक्षित डेटा शेयरिंग
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {banks.map(bank => (
                <button key={bank.id} onClick={() => handleBankSelect(bank)} style={{
                  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px',
                  padding: '20px 16px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s ease', fontSize: '14px',
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#0F6E56'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{bank.logo}</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{bank.name}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{selectedBank.logo}</div>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedBank.name}</p>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
              पंजीकृत मोबाइल पर भेजा गया OTP डालें
            </p>
            <input type="text" inputMode="numeric" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="● ● ● ● ● ●"
              style={{
                width: '200px', padding: '16px', textAlign: 'center', fontSize: '24px',
                letterSpacing: '8px', borderRadius: '16px', border: '2px solid #E5E7EB',
                outline: 'none', fontWeight: 700,
              }}
              onFocus={e => e.target.style.borderColor = '#0F6E56'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            {otpError && <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px' }}>{otpError}</p>}
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Demo: कोई भी 6 अंक डालें</p>
            <button onClick={handleOtpSubmit} style={{
              marginTop: '24px', background: '#0F6E56', color: 'white', border: 'none',
              padding: '14px 48px', borderRadius: '980px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            }}>सत्यापित करें →</button>
          </div>
        )}

        {/* Step: Consent */}
        {step === 'consent' && (
          <div>
            <div style={{
              background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '12px',
              padding: '16px', marginBottom: '20px',
            }}>
              <p style={{ fontWeight: 700, color: '#92400E', marginBottom: '8px' }}>⚠️ सहमति अनुरोध</p>
              <p style={{ fontSize: '14px', color: '#78350F' }}>
                {selectedBank.name} आपके खाते का डेटा केवल वित्तीय विश्लेषण के लिए VAANI के साथ साझा करेगा।
              </p>
            </div>
            <ul style={{ fontSize: '14px', color: '#374151', marginBottom: '24px', paddingLeft: '20px' }}>
              <li>✅ खाता शेष और लेनदेन</li>
              <li>✅ FD/RD विवरण</li>
              <li>❌ आधार/PAN नंबर नहीं</li>
              <li>❌ पासवर्ड नहीं</li>
            </ul>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleConsent} style={{
                flex: 1, background: '#0F6E56', color: 'white', border: 'none',
                padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              }}>सहमत हूं ✓</button>
              <button onClick={onClose} style={{
                background: '#F3F4F6', border: 'none', padding: '14px 20px',
                borderRadius: '12px', fontSize: '16px', cursor: 'pointer',
              }}>रद्द</button>
            </div>
          </div>
        )}

        {/* Step: Fetching */}
        {step === 'fetching' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '56px', height: '56px',
              border: '4px solid #E5E7EB', borderTopColor: '#0F6E56',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ fontWeight: 600, fontSize: '16px' }}>डेटा ला रहे हैं...</p>
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>AA फ्रेमवर्क — एन्क्रिप्टेड ट्रांसफर</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && portfolio && (
          <div>
            {/* Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #0F6E56, #10B981)', borderRadius: '16px',
              padding: '20px', color: 'white', marginBottom: '20px',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>{portfolio.bankName}</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>
                ₹{portfolio.totalBalance.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>कुल शेष</div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '14px' }}>
                <span>आय: ₹{portfolio.monthlyIncome.toLocaleString('en-IN')}</span>
                <span>बचत दर: {portfolio.savingsRate}%</span>
              </div>
            </div>

            {/* Accounts */}
            {portfolio.accounts.map((acc, i) => (
              <div key={i} style={{
                background: '#F9FAFB', borderRadius: '12px', padding: '12px 16px', marginBottom: '8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{acc.type}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{acc.accountNumber}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0F6E56' }}>₹{acc.balance.toLocaleString('en-IN')}</div>
              </div>
            ))}

            {/* Recommendations */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>💡 सुझाव</h3>
              {recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '12px', borderRadius: '12px', marginBottom: '8px',
                  background: rec.priority === 'high' ? '#FEF3C7' : '#ECFDF5',
                  border: `1px solid ${rec.priority === 'high' ? '#F59E0B' : '#10B981'}`,
                  fontSize: '14px',
                }}>
                  {rec.emoji} {rec.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
