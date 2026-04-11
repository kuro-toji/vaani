import { useState, useEffect } from 'react'
import { franc } from 'franc-min'

const LANGUAGES = {
  'hin': 'Hindi',
  'ben': 'Bengali', 
  'tam': 'Tamil',
  'tel': 'Telugu',
  'mar': 'Marathi',
  'guj': 'Gujarati',
  'kan': 'Kannada',
  'mal': 'Malayalam',
  'pan': 'Punjabi',
  'eng': 'English'
}

function App() {
  const [inputText, setInputText] = useState('')
  const [detectedLang, setDetectedLang] = useState(null)
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (inputText.trim().length > 10) {
      const langCode = franc(inputText, { minLength: 10 })
      setDetectedLang(LANGUAGES[langCode] || langCode)
    } else {
      setDetectedLang(null)
    }
  }, [inputText])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Please add your Gemini API key in .env file')
      }

      const langName = detectedLang || 'English'
      
      const prompt = `You are Vaani, a friendly personal finance assistant for Indian users. 
A user has asked a question in ${langName}. Provide helpful, accurate financial advice 
in a conversational tone. Cover topics like: savings, investments, insurance, loans, 
tax saving, retirement planning, and budgeting.

User's question: ${inputText}

Respond in ${langName} with practical, culturally relevant advice for the Indian context.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!reply) {
        throw new Error('No response received from API')
      }

      setResponse(reply)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">व</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Vaani</h1>
          <p className="text-gray-600 mt-1">India's Vernacular Personal Finance Assistant</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Ask your finance question
              </label>
              <textarea
                id="question"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="मैं ₹50,000 की सैलरी पर टैक्स बचाऊंगा? (How do I save tax on ₹50,000 salary?)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                rows={4}
                required
              />
            </div>

            {detectedLang && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  Detected: {detectedLang}
                </span>
                <span className="text-gray-400">• Response will be in {detectedLang}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Thinking...
                </span>
              ) : 'Get Finance Advice'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {response && (
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Vaani's Advice
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{response}</p>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Built with ❤️ for India's financial literacy</p>
        </footer>
      </div>
    </div>
  )
}

export default App
