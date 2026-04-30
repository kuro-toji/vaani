import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Simple auth state (in production, connect to Supabase)
const isAuthenticated = () => localStorage.getItem('vaani_user') !== null;
const login = () => localStorage.setItem('vaani_user', JSON.stringify({ id: 'demo', name: 'Demo User' }));
const logout = () => localStorage.removeItem('vaani_user');

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage onLogin={login} />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard onLogout={logout} />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;