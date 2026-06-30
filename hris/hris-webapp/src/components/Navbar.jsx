// src/components/Navbar.jsx
// =============================================================================
// 📌 NAVBAR COMPONENT
// =============================================================================

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  // =============================================================================
  // 🔐 ROLE-BASED ACCESS CONTROL (RBAC)
  // =============================================================================
  const isAdmin = user?.accessLevel === 1;
  const isRegularApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isFinalApprover = user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver09';
  const isDeptApprover = user?.roleCateg === 'Approver05' || user?.roleCateg === 'Approver08' || user?.roleCateg === 'Approver07';
  const isCEO = user?.roleCateg === 'Approver09';
  const canRegularize = user?.allowedRegzn === 1;
  
  // ⭐ NEW: Attendance Regularization Approver
  const isAttenRegApprover = user?.roleCateg === 'Approver07' || user?.roleCateg === 'Approver08' ||  user?.roleCateg === 'Approver09';
  
  // =============================================================================
  // 📊 REACT STATE
  // =============================================================================
  const [pendingClockOut, setPendingClockOut] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [clocking, setClocking] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cooldownTrigger, setCooldownTrigger] = useState(0);
  
  const isClockedInRef = useRef(false);
  const clockInTimeRef = useRef(null);

  // =============================================================================
  // 🔄 EFFECTS (Clock In/Out logic - unchanged)
  // =============================================================================
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
      
      checkTodayStatus();
    }
  }, [user?.id]);

  useEffect(() => {
    const savedUnlockTime = localStorage.getItem(`clockOutUnlockTime_${user?.id}`);
    if (savedUnlockTime) {
      const timeLeft = parseInt(savedUnlockTime) - Date.now();
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          localStorage.removeItem(`clockOutUnlockTime_${user?.id}`);
          setCooldownTrigger(prev => prev + 1);
        }, timeLeft);
        return () => clearTimeout(timer);
      } else {
        localStorage.removeItem(`clockOutUnlockTime_${user?.id}`);
      }
    }
  }, [user?.id, todayStatus]);

  // =============================================================================
  // 📡 CHECK TODAY'S ATTENDANCE STATUS
  // =============================================================================
  const checkTodayStatus = async () => {
    if (!user?.id) return;
    setLoadingStatus(true);
    try {
      const localIsClockedIn = localStorage.getItem(`pendingClockOut_${user.id}`) === 'true';
      const savedClockInTime = localStorage.getItem(`clockInTime_${user.id}`);

      const result = await api.getTodayAttendance(user.id);
      console.log('📡 Server response:', result);
      
      if (result) {
        const attendanceData = result.data ? result.data : result;
        
        const isDbClockedIn = attendanceData.clockedIn === true || attendanceData.clockedIn === 'true';
        const isDbClockedOut = attendanceData.clockedOut === true || attendanceData.clockedOut === 'true';

        const shouldShowClockIn = attendanceData.shouldShowClockIn === true;
        const shouldShowCompleted = attendanceData.shouldShowCompleted === true;
        const statusMessage = attendanceData.statusMessage || '';
        const clockInDisabledReason = attendanceData.clockInDisabledReason || '';

        if ((isDbClockedIn && !isDbClockedOut) || (localIsClockedIn && !isDbClockedOut)) {
          console.log('🌙 Active Shift Session Confirmed.');
          
          const databaseTime = attendanceData.clockInTime || attendanceData.clock_in_time;
          const finalClockInTime = databaseTime || savedClockInTime || 'Active Shift';

          localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
          localStorage.setItem(`clockInTime_${user.id}`, String(finalClockInTime));
          
          setPendingClockOut(true);
          isClockedInRef.current = true;
          clockInTimeRef.current = String(finalClockInTime);
          
          setTodayStatus({
            ...attendanceData,
            clockedIn: true,
            clockedOut: false,
            clockInTime: String(finalClockInTime),
            shouldShowClockIn: false,
            shouldShowCompleted: false
          });
          
        } else {
          console.log('User is NOT clocked in (or shift complete)');
          
          localStorage.removeItem(`pendingClockOut_${user.id}`);
          localStorage.removeItem(`clockInTime_${user.id}`);
          localStorage.removeItem(`clockOutUnlockTime_${user.id}`);
          setPendingClockOut(false);
          isClockedInRef.current = false;
          clockInTimeRef.current = null;
          
          setTodayStatus({
            clockedIn: false,
            clockedOut: false,
            isOnLeave: attendanceData.isOnLeave || false,
            isNightShift: attendanceData.isNightShift || 0,
            shouldShowClockIn: shouldShowClockIn,
            shouldShowCompleted: shouldShowCompleted,
            statusMessage: statusMessage,
            clockInDisabledReason: clockInDisabledReason,
            clockInTime: attendanceData.clockInTime || '',
            clockOutTime: attendanceData.clockOutTime || '',
            earlyClockInHours: attendanceData.earlyClockInHours || 3,
            // ⭐ New flags for forgotten clock out
            hasForgottenClockOut: attendanceData.hasForgottenClockOut || false,
            forgottenShiftDate: attendanceData.forgottenShiftDate || '',
            forgottenClockInTime: attendanceData.forgottenClockInTime || '',
            isWithinEarlyWindow: attendanceData.isWithinEarlyWindow || false
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
    clockInTimeRef.current = null;
  };

  // =============================================================================
  // 🕐 CLOCK IN / OUT HANDLERS
  // =============================================================================
  const handleClockIn = async () => {
    setClocking(true);
    try {
      const isNightShift = user?.isNightShift ?? 0 ;
      
      const result = await api.clockIn(
        user.id,
        user.name,
        user.schedArrangement,
        '',
        user.regHoursFr || '8:00 AM',   
        user.regHoursTo || '5:00 PM',   
        isNightShift  
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
          isNightShift: isNightShift  
        };
        
        setTodayStatus(newStatus);
        setPendingClockOut(true);
        isClockedInRef.current = true;
        clockInTimeRef.current = timeStr;
        
        localStorage.setItem(`pendingClockOut_${user.id}`, 'true');
        localStorage.setItem(`clockInTime_${user.id}`, timeStr);
        localStorage.setItem(`isNightShift_${user.id}`, isNightShift); 
        
        const unlockTimestamp = Date.now() + 10000;
        localStorage.setItem(`clockOutUnlockTime_${user.id}`, unlockTimestamp);
        
        setTimeout(() => {
          localStorage.removeItem(`clockOutUnlockTime_${user.id}`);
          setCooldownTrigger(prev => prev + 1);
        }, 10000);
        
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
        
        setTodayStatus(prev => ({
          ...prev,
          clockedOut: true,
          clockOutTime: timeStr
        }));
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

  // =============================================================================
  // 🎨 ROLE ICON & NAME HELPERS
  // =============================================================================
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

  // =============================================================================
  // ⏰ TIME FORMATTING HELPER
  // =============================================================================
  const formatTimeDisplay = (timeString) => {
    if (!timeString || timeString === '{}') return '';
    if (timeString.match(/(\d+):(\d+)\s*(AM|PM)/i)) return timeString;
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // =============================================================================
  // 🖥️ CLOCK SECTION RENDERER
  // =============================================================================
  const renderClockSection = () => {
    if (loadingStatus || !isInitialized) {
      return <div className="clock-status loading">⏳ Syncing Attendance...</div>;
    }

    const isClockedIn = todayStatus?.clockedIn === true || isClockedInRef.current === true;
    const isClockedOut = todayStatus?.clockedOut === true;

    if (todayStatus?.shouldShowCompleted) {
      return (
        <div className="clock-status completed">
          {todayStatus?.statusMessage || `✅ Completed: ${formatTimeDisplay(todayStatus?.clockInTime)} - ${formatTimeDisplay(todayStatus?.clockOutTime)}`}
          {todayStatus?.clockInDisabledReason && (
            <span className="clock-hint" style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
              {todayStatus.clockInDisabledReason}
            </span>
          )}
        </div>
      );
    }

    if (todayStatus?.isOnLeave && !isClockedIn) {
      return <div className="clock-status on-leave">📅 On Leave Today</div>;
    }

    if (!isClockedIn && todayStatus?.shouldShowClockIn) {
      return (
        <button onClick={handleClockIn} disabled={clocking} className="clock-nav-btn clock-in">
          {clocking ? '⏳ Clocking In...' : '🕐 CLOCK IN'}
        </button>
      );
    }

    if (!isClockedIn && !todayStatus?.shouldShowClockIn && !todayStatus?.shouldShowCompleted) {
      return (
        <div className="clock-status">
          <button disabled className="clock-nav-btn clock-in disabled" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            🕐 CLOCK IN 🔒
          </button>
          {todayStatus?.clockInDisabledReason && (
            <span className="clock-hint" style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
              {todayStatus.clockInDisabledReason}
            </span>
          )}
        </div>
      );
    }

    if (isClockedIn && !isClockedOut) {
      const displayTime = clockInTimeRef.current || todayStatus?.clockInTime;
      const savedUnlockTime = localStorage.getItem(`clockOutUnlockTime_${user?.id}`);
      const isClockOutDisabled = savedUnlockTime ? Date.now() < parseInt(savedUnlockTime) : false;
      
      return (
        <div className="clock-status clocked-in">
          <span>✅ Clocked in at <strong>{formatTimeDisplay(displayTime)}</strong></span>
          <button 
            onClick={handleClockOut} 
            disabled={clocking || isClockOutDisabled}
            className={`clock-nav-btn clock-out ${isClockOutDisabled ? 'disabled' : ''}`}
            title={isClockOutDisabled ? 'Accidental click protection active' : ''}
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

    // ⭐ Check for forgotten clock out
    const hasForgottenClockOut = todayStatus?.hasForgottenClockOut || false;
    const isWithinEarlyWindow = todayStatus?.isWithinEarlyWindow || false;

    if (hasForgottenClockOut && isWithinEarlyWindow) {
      return (
        <div className="clock-status warning-message">
          <div className="clock-actions">
            <button 
              onClick={handleClockIn} 
              disabled={clocking}
              className="clock-nav-btn clock-in"
            >
              🕐 CLOCK IN
            </button>
          </div>
          <div className="warning-note">
            <span className="warning-icon">⚠️⚠️⚠️</span>
            <span className="warning-text">
              <strong>You did not clock out yesterday!</strong>
              <br />
              Please file a <strong>CLOCK OUT Adjustment</strong> in 
              Attendance Regularization immediately.
            </span>
          </div>
        </div>
      );
    }

    return (
      <button onClick={handleClockIn} disabled={clocking} className="clock-nav-btn clock-in">
        {clocking ? '⏳ Clocking In...' : '🕐 CLOCK IN'}
      </button>
    );
  };

  // =============================================================================
  // 🖥️ MAIN RENDER
  // =============================================================================
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
        {/* 👤 My Dashboard */}
        {!isCEO && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('mydashboard')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">👤 My Dashboard <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'mydashboard' && (
              <div className="dropdown-content">
                <Link to="/dashboard" onClick={() => setOpenDropdown(null)}>📊 Leaves Record</Link>
                <Link to="/my-attendance" onClick={() => setOpenDropdown(null)}>📅 Attendance Record</Link>
                <Link to="/my-requests" onClick={() => setOpenDropdown(null)}>📋 Leave Requests</Link>
                <Link to="/new-request" onClick={() => setOpenDropdown(null)}>✨ File New Leaves</Link>
                {canRegularize && (<Link to="/attendance-reg-request" onClick={() => setOpenDropdown(null)}> ✨ File Attendce Reg </Link> )}
              </div>
            )}
          </div>
        )}

        {/* 👥 Team Dashboard */}
        {isDeptApprover && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('teamdashboard')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">👥 Team Dashboard <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'teamdashboard' && (
              <div className="dropdown-content">
                {isRegularApprover && <Link to="/approvals" onClick={() => setOpenDropdown(null)}>✅ Team Leave Mngt</Link>}
                <Link to="/dept-requests" onClick={() => setOpenDropdown(null)}>📋 Team Leave Status</Link>
                <Link to="/team-attendance" onClick={() => setOpenDropdown(null)}>📅 Team Attendance</Link>
                {isAttenRegApprover && ( <Link to="/reg-approvals" onClick={() => setOpenDropdown(null)}> ✅ Attendce Reg Mngt</Link>)}
              </div>
            )}
          </div>
        )}

        {/* 🔧 Admin Dashboard */}
        {isAdmin && (
          <div className="dropdown" onMouseEnter={() => handleMouseEnter('admin')} onMouseLeave={handleMouseLeave}>
            <button className="dropdown-btn">🔧 Admin <span className="dropdown-arrow">▼</span></button>
            {openDropdown === 'admin' && (
              <div className="dropdown-content">
                {isFinalApprover && <Link to="/final-approvals" onClick={() => setOpenDropdown(null)}>✅ All Leaves Mngt</Link>}
                <Link to="/reg-approvals" onClick={() => setOpenDropdown(null)}>✅ Attendce Reg Mngt</Link>
                <Link to="/all-attendance" onClick={() => setOpenDropdown(null)}>📅 All Attendance</Link>
                <Link to="/admin" onClick={() => setOpenDropdown(null)}>📋 All Leaves Status</Link>
                <Link to="/daily-timekeep" onClick={() => setOpenDropdown(null)}>📊 Daily Timekeep</Link>
                <Link to="/hr-dashboard" onClick={() => setOpenDropdown(null)}>🔧 HR Acknowledgement</Link>               
              </div>
            )}
          </div>
        )}

        {/* 👤 Profile */}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>👤 Profile</Link>
      </div>
    </nav>
  );
}

export default Navbar;