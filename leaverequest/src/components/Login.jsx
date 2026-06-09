// src/components/Login.jsx
import { useState } from 'react';
import { api } from '../utils/api';


function Login({ onLoginSuccess }) { // <-- Accept the prop here
  const [employeeID, setEmployeeID] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(employeeID, password);

      if (data.success) {
        console.log('Login Successful!', data.employee);
        
        // 1. Save to local storage
        localStorage.setItem('userSession', JSON.stringify(data.employee));
        
        alert(`Welcome, ${data.employee.name}!`); 
        
        // 2. Tell App.jsx to change the view to UserMain
        onLoginSuccess(data.employee); 
        
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Leave Request System</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              value={employeeID}
              onChange={(e) => setEmployeeID(e.target.value)}
              required
              placeholder="Enter your Employee ID"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;