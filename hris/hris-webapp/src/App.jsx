// src/App.jsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import UserMain from './components/UserMain';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (employeeData) => {
    setUser(employeeData);  // This triggers re-render to show UserMain
  };

 const handleLogout = () => {
  // Don't clear the pending flag here - we want it to persist for re-login
  // localStorage.removeItem(`pendingClockOut_${user?.id}`); // ← DON'T do this
  localStorage.removeItem('userSession');
  setUser(null);
};

  // If no user logged in, show Login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is logged in, show the main app (Dashboard is the default page)
  return <UserMain user={user} onLogout={handleLogout} />;
}

export default App;