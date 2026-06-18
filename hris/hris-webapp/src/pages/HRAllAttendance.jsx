// src/pages/HRAllAttendance.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function HRAllAttendance({ user }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadAllAttendance();
  }, [user.id, selectedMonth, selectedYear]);

  const loadAllAttendance = async () => {
    setLoading(true);
    const result = await api.getAllAttendance(selectedMonth + 1, selectedYear);
    if (result.success) {
      setAttendanceRecords(result.records);
      
      // Extract unique departments for filter
      const depts = [...new Set(result.records.map(r => r.deptName))];
      setDepartments(depts);
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

  const getStatusBadge = (record) => {
    if (isFutureDate(record.date)) {
      return { text: 'UPCOMING', class: 'status-upcoming', icon: '📅' };
    }
    if (record.isOnLeave) return { text: 'ON LEAVE', class: 'status-leave', icon: '🌴' };
    if (!record.clockInTime) return { text: 'ABSENT', class: 'status-absent', icon: '❌' };
    if (record.clockInTime && !record.clockOutTime) return { text: 'INCOMPLETE', class: 'status-incomplete', icon: '🕐' };
    if (record.tardinessMinutes > 0 && !record.isTardyExcused) {
      return { text: 'LATE', class: 'status-late', icon: '⚠️' };
    }
    return { text: 'COMPLETE', class: 'status-complete', icon: '✅' };
  };

  // Get filtered records based on toggle and department
  const getFilteredRecords = () => {
    let result = [...attendanceRecords];
    
    // Department filter
    if (departmentFilter !== 'ALL') {
      result = result.filter(r => r.deptName === departmentFilter);
    }
    
    // Upcoming filter
    if (!showUpcoming) {
      result = result.filter(record => !isFutureDate(record.date));
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

  const futureCount = attendanceRecords.filter(record => isFutureDate(record.date)).length;
  const totalEmployees = new Set(attendanceRecords.map(r => r.employeeId)).size;

  // Calculate summary
  const totalDays = pastRecords.length;
  const presentDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'COMPLETE';
  }).length;
  const absentDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'ABSENT';
  }).length;
  const leaveDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'ON LEAVE';
  }).length;
  const incompleteDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'INCOMPLETE';
  }).length;
  const totalTardiness = pastRecords.reduce((sum, r) => sum + (r.tardinessMinutes || 0), 0);
  const totalUndertime = pastRecords.reduce((sum, r) => sum + (r.undertimeMinutes || 0), 0);

  // Department summary
  const deptSummary = {};
  pastRecords.forEach(record => {
    const dept = record.deptName || 'Unknown';
    if (!deptSummary[dept]) {
      deptSummary[dept] = { 
        total: 0, 
        complete: 0, 
        absent: 0, 
        onLeave: 0, 
        incomplete: 0,
        late: 0
      };
    }
    const status = getStatusBadge(record).text;
    deptSummary[dept].total++;
    if (status === 'COMPLETE') deptSummary[dept].complete++;
    else if (status === 'ABSENT') deptSummary[dept].absent++;
    else if (status === 'ON LEAVE') deptSummary[dept].onLeave++;
    else if (status === 'INCOMPLETE') deptSummary[dept].incomplete++;
    else if (status === 'LATE') deptSummary[dept].late++;
  });

  if (loading) return <div className="loading">Loading attendance records...</div>;

  return (
    <div className="my-attendance">
      <h2>📊 HR All Attendance</h2>
      <div className='my-attendance-desc-page'>
        View all employee attendance records across all departments
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
          <div className="filter-group">
            <label>Department:</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <button onClick={loadAllAttendance} className="refresh-btn">Refresh</button>
        </div>

        {/* Toggle for UPCOMING */}
        <div className="toggle-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showUpcoming}
              onChange={() => setShowUpcoming(!showUpcoming)}
            />
            Show UPCOMING ({futureCount})
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary">
        <div className="summary-card">
          <h3>👥 Employees</h3>
          <p className="summary-number">{totalEmployees}</p>
        </div>
        <div className="summary-card present">
          <h3>✅ Complete</h3>
          <p className="summary-number">{presentDays}</p>
        </div>
        <div className="summary-card absent">
          <h3>❌ Absent</h3>
          <p className="summary-number">{absentDays}</p>
        </div>
        <div className="summary-card leave">
          <h3>🌴 On Leave</h3>
          <p className="summary-number">{leaveDays}</p>
        </div>
        <div className="summary-card incomplete">
          <h3>🕐 Incomplete</h3>
          <p className="summary-number">{incompleteDays}</p>
        </div>
      </div>

      {/* Department Summary */}
      <div className="dept-summary">
        <h3>Department Summary</h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total</th>
                <th>✅ Complete</th>
                <th>❌ Absent</th>
                <th>🌴 On Leave</th>
                <th>🕐 Incomplete</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(deptSummary).length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table">No records found</td>
                </tr>
              ) : (
                Object.entries(deptSummary).map(([dept, data]) => (
                  <tr key={dept}>
                    <td>{dept}</td>
                    <td>{data.total}</td>
                    <td className="present-cell">{data.complete}</td>
                    <td className="absent-cell">{data.absent}</td>
                    <td className="leave-cell">{data.onLeave}</td>
                    <td className="incomplete-cell">{data.incomplete}</td>
                    <td>
                      {data.total > 0 ? Math.round((data.complete / data.total) * 100) : 0}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tardiness & Undertime Summary */}
      <div className="violation-summary">
        <div className="violation-card">
          <span className="violation-label">Total Tardiness:</span>
          <span className="violation-value">{totalTardiness} minutes</span>
        </div>
        <div className="violation-card">
          <span className="violation-label">Total Undertime:</span>
          <span className="violation-value">{totalUndertime} minutes</span>
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
              <th>Employee</th>
              <th>Department</th>
              <th>Date</th>
              <th>Schedule</th>
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
                const status = getStatusBadge(record);
                return (
                  <tr key={idx} className={isFutureDate(record.date) ? 'future-row' : ''}>
                    <td>
                      {record.employeeName}
                      <br />
                      <small>{record.employeeId}</small>
                    </td>
                    <td>{record.deptName}</td>
                    <td className={isFutureDate(record.date) ? 'future-date' : ''}>{record.date}</td>
                    <td>{record.schedArrangement || '-'}</td>
                    <td>{formatTime(record.clockInTime)}</td>
                    <td>{formatTime(record.clockOutTime)}</td>
                    <td>
                      <span className={`status-badge-table ${status.class}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className={record.tardinessMinutes > 0 && !record.isTardyExcused && !isFutureDate(record.date) ? 'violation-cell' : ''}>
                      {record.tardinessMinutes > 0 && !isFutureDate(record.date) ? `${record.tardinessMinutes} min` : '-'}
                    </td>
                    <td className={record.undertimeMinutes > 0 && !record.isUndertimeExcused && !isFutureDate(record.date) ? 'violation-cell' : ''}>
                      {record.undertimeMinutes > 0 && !isFutureDate(record.date) ? `${record.undertimeMinutes} min` : '-'}
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

export default HRAllAttendance;