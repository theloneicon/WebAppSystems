// src/pages/HRDailyTimeKeep.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function HRDailyTimeKeep({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    clockedIn: 0,
    clockedOut: 0,
    onLeave: 0,
    notClockedIn: 0,
    incomplete: 0
  });

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    const result = await api.getAttendanceByDate(selectedDate);
    if (result.success) {
      setAttendance(result.records);
      
      // Extract unique departments for filter
      const depts = [...new Set(result.records.map(r => r.deptName))];
      setDepartments(depts);
      
      // Calculate summary - Focus on CLOCK IN / CLOCK OUT
      const total = result.records.length;
      const clockedIn = result.records.filter(r => r.clockInTime).length;
      const clockedOut = result.records.filter(r => r.clockInTime && r.clockOutTime).length;
      const onLeave = result.records.filter(r => r.isOnLeave).length;
      const notClockedIn = result.records.filter(r => !r.clockInTime && !r.isOnLeave).length;
      const incomplete = result.records.filter(r => r.clockInTime && !r.clockOutTime).length;
      
      setSummary({ total, clockedIn, clockedOut, onLeave, notClockedIn, incomplete });
    }
    setLoading(false);
  };

  const handleExcuse = async (recordId, type, employeeName) => {
    const reason = prompt(`Excuse ${type} for ${employeeName}?\nEnter reference (Leave ID or Regularization ID):`);
    if (!reason) return;

    const result = await api.excuseViolation(recordId, type, reason, user.id);
    if (result.success) {
      alert(`✅ ${type} excused for ${employeeName}!`);
      loadAttendance();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '-';
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  };

  const getStatusBadge = (record) => {
    if (record.isOnLeave) {
      return { text: 'ON LEAVE', class: 'status-leave', icon: '🌴' };
    }
    if (!record.clockInTime) {
      return { text: 'NOT CLOCKED IN', class: 'status-notclocked', icon: '⏳' };
    }
    if (record.clockInTime && !record.clockOutTime) {
      return { text: 'INCOMPLETE', class: 'status-incomplete', icon: '🕐' };
    }
    if (record.tardinessMinutes > 0 && !record.isTardyExcused) {
      return { text: 'LATE', class: 'status-late', icon: '⚠️' };
    }
    return { text: 'COMPLETE', class: 'status-complete', icon: '✅' };
  };

  const calculateTardyDisplay = (record) => {
    if (!record.tardinessMinutes || record.tardinessMinutes === 0) return '-';
    if (record.isTardyExcused) return `${record.tardinessMinutes} min (Excused)`;
    return `${record.tardinessMinutes} min`;
  };

  const calculateUndertimeDisplay = (record) => {
    if (!record.undertimeMinutes || record.undertimeMinutes === 0) return '-';
    if (record.isUndertimeExcused) return `${record.undertimeMinutes} min (Excused)`;
    return `${record.undertimeMinutes} min`;
  };

  // Apply filters
  const filteredAttendance = attendance.filter(record => {
    if (searchTerm && !record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !record.employeeId.includes(searchTerm)) {
      return false;
    }
    if (departmentFilter !== 'ALL' && record.deptName !== departmentFilter) {
      return false;
    }
    return true;
  });

  const getStatusCount = (statusText) => {
    return attendance.filter(r => getStatusBadge(r).text === statusText).length;
  };

  if (loading) return <div className="loading">Loading attendance...</div>;

  return (
    <div className="attendance-dashboard-modern">
      
        <h2>📊 Daily Timekeep</h2>
        <p className="subtitle">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      

      {/* Date Selector */}
      <div className="date-controls">
        <div className="date-picker">
          <label>📅 Select Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={loadAttendance} className="refresh-btn">⟳ Refresh</button>
        </div>
        
        <button className="export-btn" onClick={() => {
          const csv = filteredAttendance.map(r => 
            `${r.employeeName},${r.deptName},${r.clockInTime || '-'},${r.clockOutTime || '-'},${getStatusBadge(r).text},${calculateTardyDisplay(r)},${calculateUndertimeDisplay(r)}`
          ).join('\n');
          const blob = new Blob([`Employee,Department,Clock In,Clock Out,Status,Tardiness,Undertime\n${csv}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_${selectedDate}.csv`;
          a.click();
        }}>
          📎 Export CSV
        </button>
      </div>

      {/* Summary Cards - Focus on Clock In/Out */}
      <div className="summary-grid">
        <div className="summary-card-modern total">
          <div className="card-info">
            <h3>{summary.total}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="summary-card-modern clockedin">
          <div className="card-info">
            <h3>{summary.clockedIn}</h3>
            <p>Clocked In</p>
          </div>
        </div>
        <div className="summary-card-modern clockedout">
          <div className="card-info">
            <h3>{summary.clockedOut}</h3>
            <p>Clocked Out</p>
          </div>
        </div>
        <div className="summary-card-modern notclockedin">
          <div className="card-info">
            <h3>{summary.notClockedIn}</h3>
            <p>Not Clocked In</p>
          </div>
        </div>
        <div className="summary-card-modern incomplete">
          <div className="card-info">
            <h3>{summary.incomplete}</h3>
            <p>Incomplete</p>
          </div>
        </div>
        <div className="summary-card-modern leave">
          <div className="card-info">
            <h3>{summary.onLeave}</h3>
            <p>On Leave</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="ALL">All Departments ({attendance.length})</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept} ({attendance.filter(r => r.deptName === dept).length})</option>
          ))}
        </select>
        <div className="summary-badge">
          <span className="badge-clockedin">⬆️ {summary.clockedIn} In</span>
          <span className="badge-clockout">✅ {summary.clockedOut} Out</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <table className="attendance-table-modern">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Schedule</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Status</th>
              <th>Tardiness</th>
              <th>Undertime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="9">
                  <div className="empty-state">
                    <span>📭</span>
                    <p>No attendance records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAttendance.map(record => {
                const status = getStatusBadge(record);
                return (
                  <tr key={record.employeeId} className={status.text === 'NOT CLOCKED IN' ? 'absent-row' : ''}>
                    <td className="employee-cell">
                      <span className="employee-name">{record.employeeName}</span>
                      <span className="employee-id">{record.employeeId}</span>
                    </td>
                    <td>{record.deptName}</td>
                    <td className="schedule-cell">
                      <span className="schedule-type">{record.schedArrangement}</span>
                      <span className="schedule-time">{formatDisplayTime(record.scheduleStart)} - {formatDisplayTime(record.scheduleEnd)}</span>
                    </td>
                    <td className="time-cell">{formatDisplayTime(record.clockInTime)}</td>
                    <td className="time-cell">{formatDisplayTime(record.clockOutTime)}</td>
                    <td>
                      <span className={`status-badge-modern ${status.class}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className={record.tardinessMinutes > 0 && !record.isTardyExcused ? 'violation-cell' : ''}>
                      {calculateTardyDisplay(record)}
                      {record.tardinessMinutes > 0 && !record.isTardyExcused && (
                        <button 
                          onClick={() => handleExcuse(record.recordId, 'TARDINESS', record.employeeName)}
                          className="excuse-btn-mini"
                          title="Excuse tardiness"
                        >
                          🙏
                        </button>
                      )}
                    </td>
                    <td className={record.undertimeMinutes > 0 && !record.isUndertimeExcused ? 'violation-cell' : ''}>
                      {calculateUndertimeDisplay(record)}
                      {record.undertimeMinutes > 0 && !record.isUndertimeExcused && (
                        <button 
                          onClick={() => handleExcuse(record.recordId, 'UNDERTIME', record.employeeName)}
                          className="excuse-btn-mini"
                          title="Excuse undertime"
                        >
                          🙏
                        </button>
                      )}
                    </td>
                    <td className="actions-cell">
                      {record.isOnLeave && record.leaveReference && (
                        <span className="leave-ref" title={`Leave Reference: ${record.leaveReference}`}>
                          📋
                        </span>
                      )}
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

export default HRDailyTimeKeep;