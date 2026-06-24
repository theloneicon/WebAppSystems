// src/pages/MyAttendance.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function MyAttendance({ user }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false); // ← NEW

  useEffect(() => {
    loadAttendanceRecords();
  }, [user.id, selectedMonth, selectedYear]);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    const result = await api.getMyAttendance(user.id, selectedMonth + 1, selectedYear);
    if (result.success) {
      setAttendanceRecords(result.records);
    }
    setLoading(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
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

  const isFutureDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const getStatusBadge = (record) => {
    // Check if date is in the future
    if (isFutureDate(record.date)) {
      return <span className="status-badge-table status-upcoming">📅 UPCOMING</span>;
    }
    
    // Check if it's a weekend
    if (isWeekend(record.date)) {
      // If employee clocked in AND clocked out on weekend → COMPLETE
      if (record.clockInTime && record.clockOutTime) {
        return <span className="status-badge-table status-complete">✅ COMPLETE</span>;
      }
      // If employee clocked in but NOT clocked out on weekend → INCOMPLETE
      if (record.clockInTime && !record.clockOutTime) {
        return <span className="status-badge-table status-in">🕐 INCOMPLETE</span>;
      }
      // If no clock in on weekend → WEEKEND (rest day)
      return <span className="status-badge-table status-weekend">📅 WEEKEND</span>;
    }
    
    // Regular weekday logic
    if (record.isOnLeave) return <span className="status-badge-table status-leave">🌴 ON LEAVE</span>;
    if (!record.clockInTime) return <span className="status-badge-table status-absent">❌ ABSENT</span>;
    if (record.clockInTime && !record.clockOutTime) return <span className="status-badge-table status-in">🕐 INCOMPLETE</span>;
    return <span className="status-badge-table status-complete">✅ COMPLETE</span>;
  };

  // Get filtered records based on toggles
  const getFilteredRecords = () => {
    let result = [...attendanceRecords];
    
    // Upcoming filter
    if (!showUpcoming) {
      result = result.filter(record => !isFutureDate(record.date));
    }
    
    // Weekend filter
    if (!showWeekend) {
      result = result.filter(record => !isWeekend(record.date));
    }
    
    return result;
  };

  const filteredRecords = getFilteredRecords();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  // Filter out future dates for summary
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const pastRecords = filteredRecords.filter(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate <= currentDate;
  });

  const formatMinutes = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    const formatted = parseFloat(minutes.toFixed(2));
    return `${formatted} min`;
  };  

  const futureCount = attendanceRecords.filter(record => isFutureDate(record.date)).length;
  const weekendCount = attendanceRecords.filter(record => isWeekend(record.date)).length;

  // Calculate summary (excluding weekends and future dates)
  const weekdaysOnly = pastRecords.filter(r => !isWeekend(r.date));
  const totalDays = weekdaysOnly.length;
  const presentDays = weekdaysOnly.filter(r => r.clockInTime).length;
  const absentDays = weekdaysOnly.filter(r => !r.clockInTime && !r.isOnLeave).length;
  const leaveDays = weekdaysOnly.filter(r => r.isOnLeave).length;
  const lateDays = weekdaysOnly.filter(r => r.tardinessMinutes > 0 && !r.isTardyExcused).length;
  const totalTardiness = weekdaysOnly.reduce((sum, r) => sum + (r.tardinessMinutes || 0), 0);
  const totalUndertime = weekdaysOnly.reduce((sum, r) => sum + (r.undertimeMinutes || 0), 0);

  // Count weekends worked
  const weekendWorked = pastRecords.filter(r => isWeekend(r.date) && r.clockInTime && r.clockOutTime).length;

  if (loading) return <div className="loading">Loading attendance records...</div>;

  return (
    <div className="my-attendance">
      <h2>📅 My Attendance</h2>
      <div className='my-attendance-desc-page'>
        View your daily attendance records
      </div>

      <div className="attendance-controls">
        <div className="attendance-filters">
          <div className="filter-group">
            <label>Month:</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((month, idx) => (
                <option key={idx} value={idx}>{month}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button onClick={loadAttendanceRecords} className="refresh-btn">Refresh</button>
        </div>

        {/* Toggles */}
        <div className="toggle-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showUpcoming}
              onChange={() => setShowUpcoming(!showUpcoming)}
            />
            Show UPCOMING ({futureCount})
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showWeekend}
              onChange={() => setShowWeekend(!showWeekend)}
            />
            Show WEEKENDS ({weekendCount})
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary">
        <div className="summary-card">
          <h3>Total Days</h3>
          <p className="summary-number">{totalDays}</p>
        </div>
        <div className="summary-card present">
          <h3>Present</h3>
          <p className="summary-number">{presentDays}</p>
        </div>
        <div className="summary-card absent">
          <h3>Absent</h3>
          <p className="summary-number">{absentDays}</p>
        </div>
        <div className="summary-card leave">
          <h3>On Leave</h3>
          <p className="summary-number">{leaveDays}</p>
        </div>
        <div className="summary-card late">
          <h3>Late Days</h3>
          <p className="summary-number">{lateDays}</p>
        </div>
      </div>

      {/* Weekend Summary */}
      <div className="weekend-summary">
        <div className="weekend-card">
          <span className="weekend-label">📅 Weekends this month:</span>
          <span className="weekend-value">{weekendCount} days</span>
        </div>
        <div className="weekend-card worked">
          <span className="weekend-label">✅ Weekend days worked:</span>
          <span className="weekend-value">{weekendWorked} days</span>
        </div>
      </div>

      {/* Tardiness & Undertime Summary */}
      <div className="violation-summary">
        <div className="violation-card">
          <span className="violation-label">Total Tardiness:</span>
          <span className="violation-value">{formatMinutes(totalTardiness)}</span>
        </div>
        <div className="violation-card">
          <span className="violation-label">Total Undertime:</span>
          <span className="violation-value">{formatMinutes(totalUndertime)}</span>
        </div>
      </div>

      {/* Future dates notice */}
      {futureCount > 0 && !showUpcoming && (
        <div className="alert-info">
          📌 {futureCount} future date(s) hidden. Toggle "Show UPCOMING" to view them.
        </div>
      )}

      {/* Attendance Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Schedule</th>
              <th>Shift</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Status</th>
              <th>Tardiness</th>
              <th>Undertime</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table">No attendance records found</td>
              </tr>
            ) : (
              filteredRecords.map((record, idx) => {
                const isWeekendDay = isWeekend(record.date);
                const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
                const shiftType = record.isNightShift ? '🌙 Night' : '☀️ Day';
                return (
                  <tr key={idx} className={isFutureDate(record.date) ? 'future-row' : ''}>
                    <td className={isFutureDate(record.date) ? 'future-date' : ''}>{record.date}</td>
                    <td className={isWeekendDay ? 'weekend-day' : ''}>{dayName}</td>
                    <td>{record.schedArrangement || '-'}</td>
                    <td className="shift-cell">{shiftType}</td>
                    <td>{formatTime(record.clockInTime)}</td>
                    <td>{formatTime(record.clockOutTime)}</td>
                    <td>{getStatusBadge(record)}</td>
                    <td className={record.tardinessMinutes > 0 && !record.isTardyExcused && !isFutureDate(record.date) ? 'violation-cell' : ''}>
                      {record.tardinessMinutes > 0 && !isFutureDate(record.date) ? `${formatMinutes(record.tardinessMinutes)}` : '-'}
                    </td>
                    <td className={record.undertimeMinutes > 0 && !record.isUndertimeExcused && !isFutureDate(record.date) ? 'violation-cell' : ''}>
                      {record.undertimeMinutes > 0 && !isFutureDate(record.date) ? `${formatMinutes(record.undertimeMinutes)}` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyAttendance;