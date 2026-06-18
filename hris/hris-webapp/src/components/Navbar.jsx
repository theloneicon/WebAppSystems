// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';


function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  // Role-based access control - USING ROLE_CATEG
  const isAdmin = user?.accessLevel === 1;
  const isRegularApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isFinalApprover = user?.roleCateg === 'Approver08';
  const isDeptApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  
  // Check if user is allowed to file Regularization (Official Business)
  const canRegularize = user?.allowedRegzn === 1;
  
  const [todayStatus, setTodayStatus] = useState(null);
  const [clocking, setClocking] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [pendingClockOut, setPendingClockOut] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkTodayStatus();
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
    if (isRegularApprover || isFinalApprover) return '👑';
    return '👤';
  };

  const getRoleName = () => {
    if (user?.accessLevel === 1) return 'Admin';
    if (isFinalApprover) return 'Senior Approver';
    if (isRegularApprover) return 'Regular Approver';
    return 'Normal User';
  };

  const handleMouseEnter = (dropdown) => {
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    if (timeString.match(/(\d+):(\d+)\s*(AM|PM)/i)) {
      return timeString;
    }
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

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
        {/* My Dashboard Dropdown - For Normal Users */}
        <div 
          className="dropdown"
          onMouseEnter={() => handleMouseEnter('mydashboard')}
          onMouseLeave={handleMouseLeave}
        >
          <button className="dropdown-btn">
            <span className="nav-icon">👤</span> My Dashboard <span className="dropdown-arrow">▼</span>
          </button>
          {openDropdown === 'mydashboard' && (
            <div className="dropdown-content">
              <Link to="/dashboard" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📊</span> Leaves Record
              </Link>
              <Link to="/my-attendance" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📅</span> Attendance Record
              </Link>
              <Link to="/my-requests" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📋</span> Leave Requests
              </Link>
              <Link to="/new-request" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">✨</span> File New Leaves
              </Link>
              {canRegularize && (
                <Link to="/regularization" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">🔄</span> Regularization
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Team Dashboard Dropdown - For Approvers (Approver05 & Approver08 & Approver07) */}
        {isDeptApprover && (
          <div 
            className="dropdown"
            onMouseEnter={() => handleMouseEnter('teamdashboard')}
            onMouseLeave={handleMouseLeave}
          >
            <button className="dropdown-btn">
              <span className="nav-icon">👥</span> Team Dashboard <span className="dropdown-arrow">▼</span>
            </button>
            {openDropdown === 'teamdashboard' && (
              <div className="dropdown-content">
                {isRegularApprover && (
                  <Link to="/approvals" onClick={() => setOpenDropdown(null)}>
                    <span className="nav-icon">✅</span>Team Leave Mngt
                  </Link>
                )}                
                <Link to="/dept-requests" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">📋</span> Team Leave Status
                </Link>
                <Link to="/team-attendance" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">📅</span> Team Attendance
                </Link>
               </div>
            )}
          </div>
        )}

        {/* Admin Dropdown - For Admin only */}
        {isAdmin && (
          <div 
            className="dropdown"
            onMouseEnter={() => handleMouseEnter('admin')}
            onMouseLeave={handleMouseLeave}
          >
            <button className="dropdown-btn">
              <span className="nav-icon">🔧</span> Admin <span className="dropdown-arrow">▼</span>
            </button>
            {openDropdown === 'admin' && (
              <div className="dropdown-content">
                {isFinalApprover && (
                  <Link to="/final-approvals" onClick={() => setOpenDropdown(null)}>
                    <span className="nav-icon">✅</span> All Leaves Mngt
                  </Link>
                )}      
              <Link to="/all-attendance" onClick={() => setOpenDropdown(null)}>
                <span className="nav-icon">📅</span> All Attendance
              </Link>          
                <Link to="/admin" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">📋</span> All Leaves Status
                </Link>
                <Link to="/daily-timekeep" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">📊</span> Daily Timekeep
                </Link>                
                <Link to="/hr-dashboard" onClick={() => setOpenDropdown(null)}>
                  <span className="nav-icon">🔧</span> HR Acknowledgement
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profile Link (no dropdown) */}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          <span className="nav-icon">👤</span> Profile
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;