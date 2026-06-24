// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  // Role-based access control
  const isAdmin = user?.accessLevel === 1;
  const isRegularApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isFinalApprover = user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver09';
  const isDeptApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isCEO = user?.roleCateg === 'Approver09';
  const canRegularize = user?.allowedRegzn === 1;
  
  // App States
  const [pendingClockOut, setPendingClockOut] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [clocking, setClocking] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Controls dynamic cooldown re-renders locally
  const [cooldownTrigger, setCooldownTrigger] = useState(0);
  
  const isClockedInRef = useRef(false);
  const clockInTimeRef = useRef(null);

  // Synchronous state hydration upon component initialization
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`pendingClockOut_${user.id}`);
      const storedClockInTime = localStorage.getItem(`clockInTime_${user.id}`);
      
      if (stored === 'true') {
        isClockedInRef.current = true;
        if (storedClockInTime) clockInTimeRef.current = storedClockInTime;
        
        setPendingClockOut(true);
        setTodayStatus({
          clockedIn: true,
          clockedOut: false,
          clockInTime: storedClockInTime || 'Just now',
          isOnLeave: false
        });
      }
      
      // Sync local status against the database payload
      checkTodayStatus();
    }
  }, [user?.id]);

  // Runs an active checker loop if a safety delay is running when page mounts or updates
  useEffect(() => {
    const savedUnlockTime = localStorage.getItem(`clockOutUnlockTime_${user?.id}`);
    if (savedUnlockTime) {
      const timeLeft = parseInt(savedUnlockTime) - Date.now();
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          localStorage.removeItem(`clockOutUnlockTime_${user?.id}`);
          setCooldownTrigger(prev => prev + 1); // Triggers re-render to lift lock
        }, timeLeft);
        return () => clearTimeout(timer);
      } else {
        localStorage.removeItem(`clockOutUnlockTime_${user?.id}`);
      }
    }
  }, [user?.id, todayStatus]);

  const checkTodayStatus = async () => {
    if (!user?.id) return;
    setLoadingStatus(true);
    try {
      const result = await api.getTodayAttendance(user.id);
      console.log('📡 Server response:', result);
      
      if (result && result.success) {
        const attendanceData = result.data || result;
        const localIsClockedIn = localStorage.getItem(`pendingClockOut_${user.id}`) === 'true';

        // Keep session active if database record or persistent local session exists
        if ((attendanceData.clockedIn && !attendanceData.clockedOut) || (localIsClockedIn && !attendanceData.clockedOut)) {
          console.log('🌙 Active Shift Session Confirmed.');
          
          localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
          setPendingClockOut(true);
          isClockedInRef.current = true;
          
          const savedClockInTime = localStorage.getItem(`clockInTime_${user.id}`);
          if (savedClockInTime && !clockInTimeRef.current) {
            clockInTimeRef.current = savedClockInTime;
          }
          
          setTodayStatus({
            ...attendanceData,
            clockedIn: true,
            clockedOut: false,
            clockInTime: clockInTimeRef.current || attendanceData.clockInTime || 'Active Shift'
          });
          
        } else if (attendanceData.clockedOut) {
          console.log('User safely clocked out completely.');
          cleanupClockStates();
          setTodayStatus(attendanceData);
        } else {
          console.log('User is NOT clocked in');
          cleanupClockStates();
          setTodayStatus({
            clockedIn: false,
            clockedOut: false,
            isOnLeave: attendanceData.isOnLeave || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking today status:', error);
    } finally {
      setLoadingStatus(false);
      setIsInitialized(true);
    }
  };

  const cleanupClockStates = () => {
    localStorage.removeItem(`pendingClockOut_${user.id}`);
    localStorage.removeItem(`clockInTime_${user.id}`);
    localStorage.removeItem(`clockOutUnlockTime_${user.id}`);
    setPendingClockOut(false);
    isClockedInRef.current = false;
  };

  const handleClockIn = async () => {
    setClocking(true);
    try {
      // ⭐ Get isNightShift from user object
     const isNightShift = user?.isNightShift ?? 0 ;
      
      const result = await api.clockIn(
        user.id,
        user.name,
        user.schedArrangement,
        '',
        user.regHoursFr || '8:00 AM',   // ⭐ From user profile
        user.regHoursTo || '5:00 PM',   // ⭐ From user profile
        isNightShift  // ⭐ NEW: Pass isNightShift
      );

      if (result && result.success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newStatus = {
          clockedIn: true,
          clockedOut: false,
          clockInTime: timeStr,
          isOnLeave: false,
          morningBreakTaken: false,
          lunchBreakTaken: false,
          afternoonBreakTaken: false,
          tardinessMinutes: result.tardinessMinutes || 0,
          undertimeMinutes: 0,
          isNightShift: isNightShift  // ⭐ NEW: Store in state
        };
        
        setTodayStatus(newStatus);
        setPendingClockOut(true);
        isClockedInRef.current = true;
        clockInTimeRef.current = timeStr;
        
        localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
        localStorage.setItem(`clockInTime_${user.id}`, timeStr);
        localStorage.setItem(`isNightShift_${user.id}`, isNightShift); // ⭐ NEW: Store
        
        // 🔒 ACCIDENTAL CLICK COOLDOWN: 60 seconds
        const unlockTimestamp = Date.now() + 5000;
        localStorage.setItem(`clockOutUnlockTime_${user.id}`, unlockTimestamp);
        
        setTimeout(() => {
          localStorage.removeItem(`clockOutUnlockTime_${user.id}`);
          setCooldownTrigger(prev => prev + 1);
        }, 5000);
        
        alert('✅ Clocked In successfully!');
        
      } else {
        alert('❌ Error: ' + (result?.error || 'Unknown response structure'));
      }
    } catch (error) {
      console.error('Clock in error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    const savedUnlockTime = localStorage.getItem(`clockOutUnlockTime_${user?.id}`);
    if (savedUnlockTime && Date.now() < parseInt(savedUnlockTime)) {
      alert('⏰ Safety Cooldown Active! Please wait a moment before trying to Clock Out.');
      return;
    }

    setClocking(true);
    try {
      const result = await api.clockOut(
        user.id,
        user.name,
        user.schedArrangement,
        '',
        user.regHoursTo || '5:00 PM'
      );
      
      if (result && result.success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newStatus = {
          ...todayStatus,
          clockedOut: true,
          clockOutTime: timeStr
        };
        
        setTodayStatus(newStatus);
        cleanupClockStates();
        alert('✅ Clocked Out successfully!');
      } else {
        alert('❌ Error: ' + (result?.error || 'Unknown tracking parser error'));
      }
    } catch (error) {
      console.error('Clock out error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setClocking(false);
    }
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

  const handleMouseEnter = (dropdown) => setOpenDropdown(dropdown);
  const handleMouseLeave = () => setOpenDropdown(null);

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    if (timeString.match(/(\d+):(\d+)\s*(AM|PM)/i)) return timeString;
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const renderClockSection = () => {
    if (loadingStatus && !isInitialized) {
      return <div className="clock-status loading">⏳ Loading...</div>;
    }

    const isClockedIn = todayStatus?.clockedIn || isClockedInRef.current;
    const isClockedOut = todayStatus?.clockedOut;

    if (todayStatus?.isOnLeave && !isClockedIn) {
      return <div className="clock-status on-leave">📅 On Leave Today</div>;
    }

    if (!isClockedIn) {
      return (
        <button onClick={handleClockIn} disabled={clocking} className="clock-nav-btn clock-in">
          {clocking ? '⏳ Clocking In...' : '🕐 CLOCK IN'}
        </button>
      );
    }

    if (isClockedIn && !isClockedOut) {
      const displayTime = clockInTimeRef.current || todayStatus?.clockInTime;
      
      // Calculate dynamic cooldown evaluation window
      const savedUnlockTime = localStorage.getItem(`clockOutUnlockTime_${user?.id}`);
      const isClockOutDisabled = savedUnlockTime ? Date.now() < parseInt(savedUnlockTime) : false;
      
      return (
        <div className="clock-status clocked-in">
          <span>✅ Clocked in at <strong>{formatTimeDisplay(displayTime)}</strong></span>
          <button 
            onClick={handleClockOut} 
            disabled={clocking || isClockOutDisabled}
            className={`clock-nav-btn clock-out ${isClockOutDisabled ? 'disabled' : ''}`}
            title={isClockOutDisabled ? 'Accidental click protection active for 1 minute' : ''}
          >
            {clocking ? '⏳ Clocking Out...' : '🏁 CLOCK OUT'}
            {isClockOutDisabled && ' 🔒'}
          </button>
          {isClockOutDisabled && <span className="clock-hint">(Locked temporary)</span>}
        </div>
      );
    }

    if (isClockedIn && isClockedOut) {
      return (
        <div className="clock-status completed">
          ✅ Completed: {formatTimeDisplay(todayStatus?.clockInTime)} - {formatTimeDisplay(todayStatus?.clockOutTime)}
        </div>
      );
    }

    return (
      <button onClick={handleClockIn} disabled={clocking} className="clock-nav-btn clock-in">
        {clocking ? '⏳ Clocking In...' : '🕐 CLOCK IN'}
      </button>
    );
  };

  return (
    <nav className="navbar">
      <div className="nav-top-row">
        <div className="nav-brand"><h3>HRIS Web App</h3></div>
        <div className="nav-user">
          <span className="user-info">
            <span className="role-icon">{getRoleIcon()}</span>
            {user?.name} ({user?.initials})
            <span className="role-badge">{getRoleName()}</span>
          </span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="nav-clock-section">{renderClockSection()}</div>

      <div className="nav-links">
        {!isCEO && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('mydashboard')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">👤 My Dashboard <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'mydashboard' && (
              <div className="dropdown-content">
                <Link to="/dashboard" onClick={() => setOpenDropdown(null)}>📊 Leaves Record</Link>
                <Link to="/my-attendance" onClick={() => setOpenDropdown(null)}>📅 Attendance Record</Link>
                <Link to="/my-requests" onClick={() => setOpenDropdown(null)}>📋 Leave Requests</Link>
                <Link to="/new-request" onClick={() => setOpenDropdown(null)}>✨ File New Leaves</Link>
                {canRegularize && <Link to="/regularization" onClick={() => setOpenDropdown(null)}>🔄 Regularization</Link>}
              </div>
            )}
          </div>
        )}

        {isDeptApprover && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('teamdashboard')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">👥 Team Dashboard <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'teamdashboard' && (
              <div className="dropdown-content">
                {isRegularApprover && <Link to="/approvals" onClick={() => setOpenDropdown(null)}>✅ Team Leave Mngt</Link>}
                <Link to="/dept-requests" onClick={() => setOpenDropdown(null)}>📋 Team Leave Status</Link>
                <Link to="/team-attendance" onClick={() => setOpenDropdown(null)}>📅 Team Attendance</Link>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('admin')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">🔧 Admin <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'admin' && (
              <div className="dropdown-content">
                {isFinalApprover && <Link to="/final-approvals" onClick={() => setOpenDropdown(null)}>✅ All Leaves Mngt</Link>}
                <Link to="/all-attendance" onClick={() => setOpenDropdown(null)}>📅 All Attendance</Link>
                <Link to="/admin" onClick={() => setOpenDropdown(null)}>📋 All Leaves Status</Link>
                <Link to="/daily-timekeep" onClick={() => setOpenDropdown(null)}>📊 Daily Timekeep</Link>
                <Link to="/hr-dashboard" onClick={() => setOpenDropdown(null)}>🔧 HR Acknowledgement</Link>
              </div>
            )}
          </div>
        )}

        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>👤 Profile</Link>
      </div>
    </nav>
  );
}

export default Navbar;