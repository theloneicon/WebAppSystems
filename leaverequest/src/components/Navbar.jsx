// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isApprover = user?.aprvLevel > 0;
  const isAdmin = user?.accessLevel === 1;  // ← Check for admin

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h3>Leave Request System</h3>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/my-requests" className={location.pathname === '/my-requests' ? 'active' : ''}>
          My Requests
        </Link>
        <Link to="/new-request" className={location.pathname === '/new-request' ? 'active' : ''}>
          New Request
        </Link>
        {isApprover && (
          <Link to="/approvals" className={location.pathname === '/approvals' ? 'active' : ''}>
            📋 Pending Approvals
          </Link>
        )}
        {/* Admin Link - only for accessLevel 1 */}
        {isAdmin && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
            🔧 Admin Dashboard
          </Link>
        )}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          Profile
        </Link>
      </div>
      <div className="nav-user">
        <span>{user?.name} ({user?.initials})</span>
        {isApprover && <span className="approver-badge">👑 Approver</span>}
        {isAdmin && <span className="admin-badge">🔧 Admin</span>}
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;