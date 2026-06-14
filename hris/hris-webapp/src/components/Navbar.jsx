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
  const [pendingClockOut, setPendingClockOut] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkTodayStatus();
      // Check localStorage for pending clock-out
      const stored = localStorage.getItem(`pendingClockOut_${user.id}`);
      console.log('Stored pendingClockOut:', stored);
      setPendingClockOut(stored === 'true');
    }
  }, [user?.id]);

  const checkTodayStatus = async () => {
    const result = await api.getTodayAttendance(user.id);
    console.log('Today attendance result:', result);
    if (result.success) {
      setTodayStatus(result);
      
      // If user is clocked in but not clocked out, ensure flag is set
      if (result.clockedIn && !result.clockedOut) {
        console.log('User is clocked in but not out, setting flag');
        localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
        setPendingClockOut(true);
      } else if (result.clockedOut) {
        console.log('User is clocked out, clearing flag');
        localStorage.removeItem(`pendingClockOut_${user.id}`);
        setPendingClockOut(false);
      }
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
    console.log('Clock in result:', result);
    console.log('User object:', user);
    console.log('Sched Arrangement:', user.schedArrangement);

    if (result.success) {
      alert('✅ Clocked In successfully!');
      // Store in localStorage that clock-out is pending
      localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
      setPendingClockOut(true);
      await checkTodayStatus();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setClocking(false);
  };

  const handleClockOut = async () => {
    if (!pendingClockOut) {
      alert('⏰ Please log out and log back in to clock out.');
      return;
    }
    
    setClocking(true);
    const result = await api.clockOut(
      user.id,
      user.name,
      user.schedArrangement,
      '',
      user.regHoursTo || '5:00 PM'
    );
    console.log('Clock out result:', result);
    if (result.success) {
      alert('✅ Clocked Out successfully!');
      // Clear the pending flag
      localStorage.removeItem(`pendingClockOut_${user.id}`);
      setPendingClockOut(false);
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

  // Add this helper function at the top of Navbar.jsx
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    // If it's already in HH:MM AM/PM format
    if (timeString.match(/(\d+):(\d+)\s*(AM|PM)/i)) {
      return timeString;
    }
    // If it's an ISO string, extract and format time
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };


  // Clock-out is enabled if:
  // 1. User has clocked in today (from server)
  // 2. User has NOT clocked out today (from server)
  // 3. There's a pending flag in localStorage
  const shouldShowClockOut = todayStatus?.clockedIn && !todayStatus?.clockedOut;
  const isClockOutEnabled = shouldShowClockOut && pendingClockOut;

  console.log('Render state:', { shouldShowClockOut, pendingClockOut, isClockOutEnabled });

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
            ✅ Clocked in at {formatTimeDisplay(todayStatus.clockInTime)}
            <button 
              onClick={handleClockOut} 
              disabled={clocking || !isClockOutEnabled}
              className={`clock-nav-btn clock-out ${!isClockOutEnabled ? 'disabled' : ''}`}
              title={!isClockOutEnabled ? 'Please log out and log back in to clock out' : ''}
            >
              🏁 CLOCK OUT {!isClockOutEnabled && '(Re-login required)'}
            </button>
          </div>
        ) : (
          <div className="clock-status completed">
            ✅ Completed: {formatTimeDisplay(todayStatus.clockInTime)} - {formatTimeDisplay(todayStatus.clockOutTime)}
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
            <Link to="/my-attendance" onClick={() => setOpenDropdown(null)}>
              <span className="nav-icon">📅</span> My Attendance
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