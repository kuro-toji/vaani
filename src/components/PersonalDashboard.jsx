import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { calculateVaaniScore } from '../services/vaaniScoreService';
import { getStreak } from '../services/streakService';
import { ChevronLeft, TrendingUp, Calendar, MessageCircle, Award, Target } from 'lucide-react';

export default function PersonalDashboard({ onClose }) {
  const { messages, language } = useChat();
  const [vaaniScore, setVaaniScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [scoreGrade, setScoreGrade] = useState('C');
  const [goals, setGoals] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    try {
      const messageArray = Array.isArray(messages) ? messages : [];
      const userMessages = messageArray.filter(m => m.role === 'user');
      const scoreData = calculateVaaniScore({
        monthlyIncome: 30000,
        savingsRatio: 15,
        hasEmergencyFund: false,
        hasInsurance: true,
        hasInvestment: true,
        lifeGoals: goals,
        dependents: 0
      }, messageArray);
      
      setVaaniScore(scoreData?.score ?? 50);
      setScoreGrade(scoreData?.grade ?? 'C');
    } catch (e) {
      console.error('Score error:', e);
      setVaaniScore(50);
      setScoreGrade('C');
    }
    
    try {
      const streakData = getStreak();
      setStreak(streakData?.current ?? streakData?.currentStreak ?? 0);
    } catch (e) {
      setStreak(0);
    }

    try {
      const messageArray = Array.isArray(messages) ? messages : [];
      const userMessages = messageArray.filter(m => m.role === 'user');
      const topics = userMessages.slice(-5).map(m => {
        const text = m.content?.substring(0, 50) || '';
        return text.length < (m.content?.length || 0) ? text + '...' : text;
      });
      setRecentTopics(topics);
    } catch (e) {
      setRecentTopics([]);
    }
    
    // Simulate loading for skeleton demonstration
    setTimeout(() => setLoading(false), 800);
  }, [messages, goals]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--vaani-success)';
    if (score >= 60) return '#22C55E';
    if (score >= 40) return 'var(--vaani-warning)';
    return 'var(--vaani-error)';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'बहुत बढ़िया! आप अपने लक्ष्यों की राह पर हैं।';
    if (score >= 60) return 'अच्छा है, लेकिन और बेहतर हो सकता है।';
    if (score >= 40) return 'ध्यान दें - कुछ कदम उठाने की जरूरत है।';
    return 'अभी कार्य करें - आपातकालीन निधि और बीमा सबसे जरूरी है।';
  };

  // Skeleton variants for loading states
  const SkeletonLine = ({ width = 'w-full', height = 'h-4' }) => (
    <div className={`skeleton ${width} ${height}`} />
  );

  const SkeletonCircle = ({ size = 'w-12 h-12' }) => (
    <div className={`skeleton rounded-full ${size}`} />
  );

  return (
    <div className="min-h-screen bg-dark text-white pb-20">
      {/* Header - Gradient matching landing page */}
      <div 
        className="px-4 py-6 pt-12"
        style={{ background: 'var(--vaani-gradient-dark)' }}
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            aria-label="वापस जाएं"
          >
            <ChevronLeft size={24} />
            <span>वापस</span>
          </button>
          <h1 className="text-lg font-semibold">मेरा डैशबोर्ड</h1>
          <div className="w-12"></div>
        </div>
        
        {/* Logo */}
        <div className="flex items-center justify-center mt-4 mb-2">
          <span className="text-3xl">📊</span>
        </div>
      </div>

      {/* VAANI Score Card */}
      <div className="px-4 -mt-6">
        <div className="card" style={{ 
          background: 'var(--vaani-gradient-dark)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'var(--vaani-shadow-lg)'
        }}>
          {loading ? (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex flex-col gap-2">
                  <SkeletonLine width="w-24" height="h-4" />
                  <SkeletonLine width="w-16" height="h-3" />
                </div>
              </div>
              <SkeletonLine width="w-20" height="h-8" />
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                >
                  <Award className="text-success" size={24} />
                </div>
                <div>
                  <p className="text-sm text-white/70">VAANI स्कोर</p>
                  <p className="text-xs text-muted">आपका वित्तीय स्वास्थ्य</p>
                </div>
              </div>
              <div className="text-right">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: getScoreColor(vaaniScore) }}
                >
                  {vaaniScore}
                </span>
                <span className="text-lg text-white/40">/100</span>
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          {loading ? (
            <div className="h-3 skeleton rounded-full overflow-hidden" />
          ) : (
            <div className="progress">
              <div 
                className="progress-bar"
                style={{ 
                  width: `${vaaniScore}%`,
                  background: `linear-gradient(90deg, ${getScoreColor(vaaniScore)}, ${getScoreColor(vaaniScore)}aa)`,
                }}
              />
            </div>
          )}
          
          <p className="mt-3 text-sm text-white/80 text-center">
            {loading ? <SkeletonLine width="w-48" height="h-4" /> : getScoreMessage(vaaniScore)}
          </p>
          
          {/* Grade Badge */}
          <div className="flex justify-center mt-4">
            {loading ? (
              <SkeletonLine width="w-20" height="h-6" />
            ) : (
              <span 
                className="badge"
                style={{
                  background: `${getScoreColor(vaaniScore)}22`,
                  color: getScoreColor(vaaniScore),
                  border: `1px solid ${getScoreColor(vaaniScore)}44`,
                }}
              >
                ग्रेड: {scoreGrade}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="px-4 mt-4">
        <div className="card" style={{ 
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 'var(--vaani-space-5)'
        }}>
          {loading ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex flex-col gap-2">
                  <SkeletonLine width="w-24" height="h-4" />
                  <SkeletonLine width="w-16" height="h-3" />
                </div>
              </div>
              <SkeletonLine width="w-16" height="h-8" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(249, 115, 22, 0.2)' }}
                >
                  <Calendar className="text-warning" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">आपकी स्ट्रीक</p>
                  <p className="text-xs text-muted">लगातार दिनों की मदद</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-warning">{streak}</span>
                <span className="text-sm text-white/40 ml-1">दिन</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Topics */}
      <div className="px-4 mt-4">
        <div className="card" style={{ 
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 'var(--vaani-space-5)'
        }}>
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(139, 92, 246, 0.2)' }}
            >
              <MessageCircle className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">हाल की बातचीत</p>
              <p className="text-xs text-muted">आपने इन विषयों पर बात की</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {loading ? (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <SkeletonLine width="w-4 h-4" />
                  <SkeletonLine width="w-full" height="h-4" />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <SkeletonLine width="w-4 h-4" />
                  <SkeletonLine width="w-3/4" height="h-4" />
                </div>
              </>
            ) : recentTopics.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">अभी तक कोई बातचीत नहीं</p>
            ) : (
              recentTopics.map((topic, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <MessageCircle size={16} className="text-white/40 mt-0.5 shrink-0" />
                  <p className="text-sm text-white/80">{topic}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Goals */}
      <div className="px-4 mt-4">
        <div className="card" style={{ 
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 'var(--vaani-space-5)'
        }}>
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(59, 130, 246, 0.2)' }}
            >
              <Target className="text-info" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">आपके लक्ष्य</p>
              <p className="text-xs text-muted">वित्तीय लक्ष्य जो आपने बताए</p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="flex flex-col gap-2">
                  <SkeletonLine width="w-32" height="h-4" />
                  <SkeletonLine width="w-24" height="h-3" />
                </div>
                <SkeletonLine width="w-12" height="h-6" />
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted">अभी कोई लक्ष्य नहीं</p>
              <p className="text-xs text-white/30 mt-1">चैट में बात करके लक्ष्य बताएं</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.map((goal, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{goal.name}</p>
                    <p className="text-xs text-muted">{goal.target}</p>
                  </div>
                  <span 
                    className="badge"
                    style={{
                      background: `${getScoreColor(vaaniScore)}22`,
                      color: getScoreColor(vaaniScore),
                    }}
                  >
                    {goal.status === 'on-track' ? 'ठीक' : 'ध्यान'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section - Gradient */}
      <div className="px-4 mt-4 mb-8">
        <div 
          className="card flex flex-col gap-3 p-5"
          style={{ background: 'var(--vaani-gradient-primary)' }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={24} />
            <p className="font-semibold">आज की टिप</p>
          </div>
          <p className="text-sm text-white/90">
            ₹500/महीना SIP शुरू करने से 10 साल में ₹1 लाख+ बन सकते हैं! 
            शुरू करें वो भी ₹100 से!
          </p>
        </div>
      </div>
    </div>
  );
}
