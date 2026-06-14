// src/components/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import MyRequests from '../pages/MyRequests';
import NewRequest from '../pages/NewRequest';
import Profile from '../pages/Profile';
import ApproverDashboard from '../pages/ApproverDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import AttendanceDashboard from '../pages/AttendanceDashboard';
import HRDashboard from '../pages/HRDashboard';
import RegularizationRequest from '../pages/RegularizationRequest';
import MyAttendance from '../pages/MyAttendance';

function AppRoutes({ user }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/my-attendance" element={<MyAttendance user={user} />} />
      <Route path="/my-requests" element={<MyRequests user={user} />} />
      <Route path="/new-request" element={<NewRequest user={user} />} />
      <Route path="/regularization" element={<RegularizationRequest user={user} />} />
      <Route path="/profile" element={<Profile user={user} />} />
      <Route path="/approvals" element={<ApproverDashboard user={user} />} />
      <Route path="/attendance" element={<AttendanceDashboard user={user} />} />
      <Route path="/hr-dashboard" element={<HRDashboard user={user} />} />
      <Route path="/admin" element={<AdminDashboard user={user} />} />
    </Routes>
  );
}

export default AppRoutes;