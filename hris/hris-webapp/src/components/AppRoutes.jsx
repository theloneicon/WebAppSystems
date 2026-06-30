// src/components/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import MyRequests from '../pages/MyRequests';
import NewRequest from '../pages/NewRequest';
import Profile from '../pages/Profile';
import ApproverDashboard from '../pages/ApproverDashboard';
import FinalApproverDashboard from '../pages/FinalApproverDashboard';
import AdminLeaveDashboard from '../pages/AdminLeaveDashboard';
import HRDailyTimeKeep from '../pages/HRDailyTimeKeep';
import HRDashboard from '../pages/HRDashboard';
import AttendanceRegRequest from '../pages/AttendanceRegRequest';
import MyAttendance from '../pages/MyAttendance';
import HRAllAttendance from '../pages/HRAllAttendance';
import TeamAttendance from '../pages/TeamAttendance';
import DeptLeaveDashboard from '../pages/DeptLeaveDashboard';
// ⭐ NEW: Attendance Regularization Approver Dashboard
import ApproverRegularizationDashboard from '../pages/ApproverRegularizationDashboard';

function AppRoutes({ user }) {
  // Use Role_Categ to determine approval rights
  const isRegularApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isFinalApprover = user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver09';
  const isDeptApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isAdmin = user?.accessLevel === 1;
  
  // ⭐ NEW: Attendance Regularization Approver
  // Approver07, Approver08, Approver09 can access the regularization approval dashboard
  const isRegApprover = user?.roleCateg === 'Approver07' || 
                         user?.roleCateg === 'Approver08' || 
                         user?.roleCateg === 'Approver09';

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/my-requests" element={<MyRequests user={user} />} />
      <Route path="/new-request" element={<NewRequest user={user} />} />
      <Route path="/attendance-reg-request" element={<AttendanceRegRequest user={user} />} />
      <Route path="/profile" element={<Profile user={user} />} />
      <Route path="/my-attendance" element={<MyAttendance user={user} />} />
      
      
      {/* Regular Approver Route */}
      {isRegularApprover && (
        <Route path="/approvals" element={<ApproverDashboard user={user} />} />
      )}
      
      {/* Final Approver Route */}
      {isFinalApprover && (
        <Route path="/final-approvals" element={<FinalApproverDashboard user={user} />} />
      )}

      {/* Team Attendance for Approver05 and Approver08 */}
      {isDeptApprover && (
        <>
          <Route path="/dept-requests" element={<DeptLeaveDashboard user={user} />} />
          <Route path="/team-attendance" element={<TeamAttendance user={user} />} />
        </>
      )}
      
      {/* ⭐ NEW: Attendance Regularization Approver Route */}
      {/* Only users with Approver07, Approver08, or Approver09 can access */}
      {isRegApprover && (
        <Route path="/reg-approvals" element={<ApproverRegularizationDashboard user={user} />} />
      )}
      
      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/all-attendance" element={<HRAllAttendance user={user} />} />
          <Route path="/daily-timekeep" element={<HRDailyTimeKeep user={user} />} />
          <Route path="/hr-dashboard" element={<HRDashboard user={user} />} />
          <Route path="/admin" element={<AdminLeaveDashboard user={user} />} />
          {/* ⭐ Admin can also access regularization approvals (override) */}
          <Route path="/reg-approvals" element={<ApproverRegularizationDashboard user={user} />} />
        </>
      )}
    </Routes>
  );
}

export default AppRoutes;