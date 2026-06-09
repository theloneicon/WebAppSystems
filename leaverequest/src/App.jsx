// src/App.jsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import UserMain from './components/UserMain';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);

  // Check if a user is already logged in when the app starts
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  const handleLoginSuccess = (employeeData) => {
    setUser(employeeData); // This triggers a re-render to show UserMain!
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUser(null); // Back to login screen
  };

  // Conditional Rendering based on authentication state
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <UserMain user={user} onLogout={handleLogout} />;
}

export default App;