// src/components/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';  // ← Remove BrowserRouter
import Dashboard from '../pages/Dashboard';
import MyRequests from '../pages/MyRequests';
import NewRequest from '../pages/NewRequest';
import Profile from '../pages/Profile';
import ApproverDashboard from '../pages/ApproverDashboard';
import AdminDashboard from '../pages/AdminDashboard';

function AppRoutes({ user }) {  // ← Remove onLogout (handled in Navbar)
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/my-requests" element={<MyRequests user={user} />} />
      <Route path="/new-request" element={<NewRequest user={user} />} />
      <Route path="/profile" element={<Profile user={user} />} />
      <Route path="/approvals" element={<ApproverDashboard user={user} />} />
      <Route path="/admin" element={<AdminDashboard user={user} />} />
    </Routes>
  );
}

export default AppRoutes;