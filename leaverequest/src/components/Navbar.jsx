// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  // Use aprvLevel to determine if user can approve (not accessLevel)
  const canApprove = user?.aprvLevel > 0;  // ← CORRECT: use aprvLevel

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h3>Leave Request System</h3>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          📊 Dashboard
        </Link>
        <Link to="/my-requests" className={location.pathname === '/my-requests' ? 'active' : ''}>
         📝 My Requests
        </Link>
        <Link to="/new-request" className={location.pathname === '/new-request' ? 'active' : ''}>
          🌟 New Request
        </Link>
        {/* Show Pending Approvals only if user has aprvLevel > 0 */}
        {canApprove && (
          <Link to="/approvals" className={location.pathname === '/approvals' ? 'active' : ''}>
            📋 Pending Approvals
          </Link>
        )}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          😀 Profile
        </Link>
      </div>
      <div className="nav-user">
        <span>{user?.name} ({user?.initials})</span>
        {canApprove && <span className="approver-badge">👑 Approver</span>}
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;