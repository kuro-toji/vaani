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

  useEffect(() => {
    try {
      // Calculate VAANI Score from conversation
      const userMessages = messages.filter(m => m.role === 'user');
      const scoreData = calculateVaaniScore({
        monthlyIncome: 30000, // Default assumption
        savingsRatio: 15,
        hasEmergencyFund: false,
        hasInsurance: true,
        hasInvestment: true,
        lifeGoals: goals,
        dependents: 0
      }, messages);
      
      setVaaniScore(scoreData?.score ?? 50);
      setScoreGrade(scoreData?.grade ?? 'C');
    } catch (e) {
      console.error('VAANI Score error:', e);
      setVaaniScore(50);
      setScoreGrade('C');
    }
    
    try {
      const streakData = getStreak();
      setStreak(streakData?.currentStreak ?? 0);
    } catch (e) {
      console.error('Streak error:', e);
      setStreak(0);
    }
    
    // Extract recent topics from conversations
    const userMessages = messages.filter(m => m.role === 'user');
    const topics = userMessages.slice(-5).map(m => {
      const text = m.content.substring(0, 50);
      return text.length < m.content.length ? text + '...' : text;
    });
    setRecentTopics(topics);
  }, [messages, goals]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#22C55E'; // Light green
    if (score >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'बहुत बढ़िया! आप अपने लक्ष्यों की राह पर हैं।';
    if (score >= 60) return 'अच्छा है, लेकिन और बेहतर हो सकता है।';
    if (score >= 40) return 'ध्यान दें - कुछ कदम उठाने की जरूरत है।';
    return 'अभी कार्य करें - आपातकालीन निधि और बीमा सबसे जरूरी है।';
  };

  return (
    <div className="min-h-screen bg-[var(--vaani-bg)] pb-20">
      {/* Header */}
      <div className="bg-[#1D9E75] text-white px-4 py-6 pt-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white"
            aria-label="वापस जाएं"
          >
            <ChevronLeft size={24} />
            <span>वापस</span>
          </button>
          <h1 className="text-lg font-semibold">मेरा डैशबोर्ड</h1>
          <div className="w-12"></div>
        </div>
      </div>

      {/* VAANI Score Card */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                <Award className="text-[#1D9E75]" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">VAANI स्कोर</p>
                <p className="text-xs text-gray-400">आपका वित्तीय स्वास्थ्य</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold" style={{ color: getScoreColor(vaaniScore) }}>
                {vaaniScore}
              </span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${vaaniScore}%`,
                backgroundColor: getScoreColor(vaaniScore)
              }}
            />
          </div>
          
          <p className="mt-3 text-sm text-gray-600 text-center">
            {getScoreMessage(vaaniScore)}
          </p>
          
          {/* Grade */}
          <div className="flex justify-center mt-4">
            <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
              scoreGrade === 'A' ? 'bg-green-100 text-green-700' :
              scoreGrade === 'B' ? 'bg-blue-100 text-blue-700' :
              scoreGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              ग्रेड: {scoreGrade}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="text-orange-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">आपकी स्ट्रीक</p>
                <p className="text-xs text-gray-400">लगातार दिनों की मदद</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-500">{streak}</span>
              <span className="text-sm text-gray-400 ml-1">दिन</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Topics */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <MessageCircle className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">हाल की बातचीत</p>
              <p className="text-xs text-gray-400">आपने इन विषयों पर बात की</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {recentTopics.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">अभी तक कोई बातचीत नहीं</p>
            ) : (
              recentTopics.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <MessageCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">{topic}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Goals */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Target className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">आपके लक्ष्य</p>
              <p className="text-xs text-gray-400">वित्तीय लक्ष्य जो आपने बताए</p>
            </div>
          </div>
          
          {goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">अभी कोई लक्ष्य नहीं</p>
              <p className="text-xs text-gray-400 mt-1">चैट में बात करके लक्ष्य बताएं</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{goal.name}</p>
                    <p className="text-xs text-gray-400">{goal.target}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    goal.status === 'on-track' ? 'bg-green-100 text-green-700' :
                    goal.status === 'behind' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {goal.status === 'on-track' ? 'ठीक' : goal.status === 'behind' ? 'ध्यान' : 'कार्य'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="px-4 mt-4 mb-8">
        <div className="bg-gradient-to-r from-[#1D9E75] to-[#0F6E56] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
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
