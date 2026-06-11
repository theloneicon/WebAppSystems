// src/components/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import MyRequests from '../pages/MyRequests';
import NewRequest from '../pages/NewRequest';
import Profile from '../pages/Profile';
import ApproverDashboard from '../pages/ApproverDashboard';

function AppRoutes({ user }) {
  // Role-based redirect
  const getDefaultRoute = () => {
    return user?.aprvLevel > 0 ? "/approvals" : "/dashboard";
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/my-requests" element={<MyRequests user={user} />} />
      <Route path="/new-request" element={<NewRequest user={user} />} />
      <Route path="/profile" element={<Profile user={user} />} />
      <Route 
        path="/approvals" 
        element={
          user?.aprvLevel > 0 ? (
            <ApproverDashboard user={user} />
          ) : (
            <Navigate to="/dashboard" />
          )
        } 
      />
    </Routes>
  );
}

export default AppRoutes;