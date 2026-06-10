// src/components/UserMain.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from '../pages/Dashboard';
import MyRequests from '../pages/MyRequests';
import NewRequest from '../pages/NewRequest';
import Profile from '../pages/Profile';
import ApproverDashboard from '../pages/ApproverDashboard';  // NEW

function UserMain({ user, onLogout }) {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/my-requests" element={<MyRequests user={user} />} />
            <Route path="/new-request" element={<NewRequest user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/approvals" element={<ApproverDashboard user={user} />} />  {/* NEW */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default UserMain;