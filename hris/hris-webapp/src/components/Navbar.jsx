// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isApprover = user?.aprvLevel > 0;
  const isAdmin = user?.accessLevel === 1;
  const [todayStatus, setTodayStatus] = useState(null);
  const [clocking, setClocking] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (user?.id) {
      checkTodayStatus();
    }
  }, [user?.id]);

  const checkTodayStatus = async () => {
    const result = await api.getTodayAttendance(user.id);
    if (result.success) {
      setTodayStatus(result);
    }
  };

  const handleClockIn = async () => {
    setClocking(true);
    const result = await api.clockIn(
      user.id,
      user.name,
      user.schedArrangement,
      '',
      user.regHoursFr || '8:00 AM'
    );
    if (result.success) {
      alert('✅ Clocked In successfully!');
      await checkTodayStatus();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setClocking(false);
  };

  const handleClockOut = async () => {
    setClocking(true);
    const result = await api.clockOut(
      user.id,
      user.name,
      user.schedArrangement,
      '',
      user.regHoursTo || '5:00 PM'
    );
    if (result.success) {
      alert('✅ Clocked Out successfully!');
      await checkTodayStatus();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setClocking(false);
  };

  const getRoleIcon = () => {
    if (user?.accessLevel === 1) return '🔧';
    if (user?.aprvLevel > 0) return '👑';
    return '👤';
  };

  const getRoleName = () => {
    if (user?.accessLevel === 1) return 'Admin';
    if (user?.aprvLevel > 0) return 'Approver';
    return 'User';
  };

  const handleMouseEnter = (dropdown) => {
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  return (
    <nav className="navbar">
      <div className="nav-top-row">
        <div className="nav-brand">
          <h3>HRIS Web App</h3>
        </div>
        <div className="nav-user">
          <span className="user-info">
            <span className="role-icon">{getRoleIcon()}</span>
            {user?.name} ({user?.initials})
            <span className="role-badge">{getRoleName()}</span>
          </span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Clock In/Out Section */}
      <div className="nav-clock-section">
        {todayStatus?.isOnLeave ? (
          <div className="clock-status on-leave">
            📅 On Leave Today
          </div>
        ) : !todayStatus?.clockedIn ? (
          <button 
            onClick={handleClockIn} 
            disabled={clocking}
            className="clock-nav-btn clock-in"
          >
            🕐 CLOCK IN
          </button>
        ) : !todayStatus?.clockedOut ? (
          <div className="clock-status clocked-in">
            ✅ Clocked in at {todayStatus.clockInTime}
            <button 
              onClick={handleClockOut} 
              disabled={clocking}
              className="clock-nav-btn clock-out"
            >
              🏁 CLOCK OUT
            </button>
          </div>
        ) : (
          <div className="clock-status completed">
            ✅ Completed: {todayStatus.clockInTime} - {todayStatus.clockOutTime}
          </div>
        )}
      </div>

      {/* Navigation Menu with Dropdowns */}
      <div className="nav-links">
        {/* Dashboard Dropdown */}
        <div 
          className="dropdown"
          onMouseEnter={() => handleMouseEnter('dashboard')}
          onMouseLeave={handleMouseLeave}
        >
          <button className="dropdown-btn">
            <span className="nav-icon">📊</span> Dashboard <span className="dropdown-arrow">▼</span>
          </button>
          {openDropdown === 'dashboard' && (
            <div className="dropdown-content">
              <Link to="/dashboard" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📊</span> My Leaves Status
              </Link>
              {isAdmin && (
                <>
                  <Link to="/attendance" onClick={() => setOpenDropdown(null)}>
                    <span className="nav-icon">📊</span> Attendance
                  </Link>
                  <Link to="/hr-dashboard" onClick={() => setOpenDropdown(null)}>
                    <span className="nav-icon">🔧</span> HR Acknowledgement
                  </Link>
                  <Link to="/admin" onClick={() => setOpenDropdown(null)}>
                    <span className="nav-icon">📋</span> All Leaves Status
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Leaves Dropdown */}
        <div 
          className="dropdown"
          onMouseEnter={() => handleMouseEnter('leaves')}
          onMouseLeave={handleMouseLeave}
        >
          <button className="dropdown-btn">
            <span className="nav-icon">📋</span> Leaves <span className="dropdown-arrow">▼</span>
          </button>
          {openDropdown === 'leaves' && (
            <div className="dropdown-content">
              <Link to="/my-requests" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📋</span> My Leaves
              </Link>
              <Link to="/new-request" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">✨</span> New Leaves
              </Link>
              {isApprover && (
                <Link to="/approvals" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">✅</span> Leave Approvals
                </Link>
              )}
              <Link to="/regularization" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">🔄</span> Regularization
              </Link>
            </div>
          )}
        </div>

        {/* Profile Link (no dropdown) */}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          <span className="nav-icon">👤</span> Profile
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;