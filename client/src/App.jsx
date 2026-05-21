import React, { useState, useEffect } from 'react';
import { Book, LogOut, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import JournalEntries from './pages/JournalEntries';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

// Configure Axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

// Decode JWT to check expiry
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const expiryTime = decoded.exp * 1000;
  return Date.now() > expiryTime;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState('dashboard'); // dashboard | ledger | trial-balance

  // Clear auth state
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setView('dashboard');
  };

  // Setup axios interceptor for auth errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearAuth();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      if (isTokenExpired(storedToken)) {
        clearAuth();
      } else {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    }
  }, []);

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    clearAuth();
  };

  const getPageTitle = () => {
    switch (view) {
      case 'ledger': return 'General Ledger';
      case 'trial-balance': return 'Trial Balance';
      default: return 'Dashboard';
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-gray-50 font-sans text-gray-900 flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="bg-[#875A7B] text-white flex-none z-50 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Apps"
              >
                <LayoutGrid className="w-5 h-5 text-white/90" />
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-wide">
                  {getPageTitle()}
                </span>
                {view !== 'dashboard' && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/90">
                    Accounting
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.namakaryawan?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-white/90 hidden sm:block">
                  {user?.namakaryawan || 'User'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 overflow-hidden flex flex-col">
        <ErrorBoundary>
          {view === 'dashboard' && (
            <div className="h-full overflow-y-auto pr-2">
              <Dashboard onNavigate={setView} />
            </div>
          )}
          {view === 'ledger' && <GeneralLedger onNavigate={setView} />}
          {view === 'trial-balance' && <TrialBalance onNavigate={setView} />}
          {view === 'journal-entries' && <JournalEntries onNavigate={setView} />}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
