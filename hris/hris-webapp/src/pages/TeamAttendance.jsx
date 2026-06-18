// src/pages/TeamAttendance.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function TeamAttendance({ user }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [weekFilter, setWeekFilter] = useState('ALL');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showEmployeeSummary, setShowEmployeeSummary] = useState(true);

  useEffect(() => {
    loadTeamAttendance();
  }, [user.id, selectedMonth, selectedYear]);

  const loadTeamAttendance = async () => {
    setLoading(true);
    const result = await api.getTeamAttendance(user.deptID, user.id, selectedMonth + 1, selectedYear);
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
    return { text: 'PRESENT', class: 'status-present', icon: '✅' };
  };

  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const weekNum = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
    return weekNum;
  };

  // Get filtered records based on all filters
  const getFilteredRecords = () => {
    let result = [...attendanceRecords];
    if (statusFilter !== 'ALL') {
      result = result.filter(r => getStatusBadge(r).text === statusFilter);
    }
    if (weekFilter !== 'ALL') {
      result = result.filter(r => getWeekNumber(r.date) === parseInt(weekFilter));
    }
    if (searchTerm) {
      result = result.filter(r => 
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.employeeId.includes(searchTerm)
      );
    }
    // Filter out UPCOMING if toggle is off
    if (!showUpcoming) {
      result = result.filter(r => getStatusBadge(r).text !== 'UPCOMING');
    }
    return result;
  };

  // Calculate summary based on filtered records
  const getFilteredSummary = () => {
    const filtered = getFilteredRecords();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const pastFiltered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate <= currentDate;
    });

    const empMap = {};
    pastFiltered.forEach(record => {
      if (!empMap[record.employeeId]) {
        empMap[record.employeeId] = {
          name: record.employeeName,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0
        };
      }
      const status = getStatusBadge(record).text;
      empMap[record.employeeId].total++;
      if (status === 'PRESENT') empMap[record.employeeId].present++;
      else if (status === 'ABSENT') empMap[record.employeeId].absent++;
      else if (status === 'LATE') empMap[record.employeeId].late++;
      else if (status === 'ON LEAVE') empMap[record.employeeId].onLeave++;
    });

    const empSummary = Object.values(empMap);
    return {
      totalEmployees: empSummary.length,
      totalPresent: empSummary.reduce((sum, e) => sum + e.present, 0),
      totalAbsent: empSummary.reduce((sum, e) => sum + e.absent, 0),
      totalLate: empSummary.reduce((sum, e) => sum + e.late, 0),
      totalOnLeave: empSummary.reduce((sum, e) => sum + e.onLeave, 0),
      filteredCount: filtered.length
    };
  };

  const filteredRecords = getFilteredRecords();
  const filteredSummary = getFilteredSummary();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027, 2028];
  const weeks = ['ALL', '1', '2', '3', '4', '5'];

  const getWeekLabel = (week) => {
    if (week === 'ALL') return 'All Weeks';
    return `Week ${week}`;
  };

  // Get week summary for the week cards
  const getWeekSummary = (records, week) => {
    const weekRecords = records.filter(r => getWeekNumber(r.date) === parseInt(week));
    const total = weekRecords.length;
    const present = weekRecords.filter(r => getStatusBadge(r).text === 'PRESENT').length;
    const absent = weekRecords.filter(r => getStatusBadge(r).text === 'ABSENT').length;
    const late = weekRecords.filter(r => getStatusBadge(r).text === 'LATE').length;
    const onLeave = weekRecords.filter(r => getStatusBadge(r).text === 'ON LEAVE').length;
    return { total, present, absent, late, onLeave };
  };

  if (loading) return <div className="loading">Loading team attendance...</div>;

  return (
    <div className="team-attendance">
      <h2>📊 My Team Attendance</h2>
      <p>Department: {user.deptName}</p>

      {/* Filters */}
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
          <label>Week:</label>
          <select value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
            {weeks.map(week => (
              <option key={week} value={week}>{getWeekLabel(week)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="ON LEAVE">On Leave</option>
            <option value="INCOMPLETE">Incomplete</option>
          </select>
        </div>
        <button onClick={loadTeamAttendance} className="refresh-btn">Refresh</button>
      </div>

      {/* Toggle Controls */}
      <div className="toggle-controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showUpcoming}
            onChange={() => setShowUpcoming(!showUpcoming)}
          />
          Show UPCOMING
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showEmployeeSummary}
            onChange={() => setShowEmployeeSummary(!showEmployeeSummary)}
          />
          Show Employee Summary
        </label>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary">
        <div className="summary-card">
          <h3>👥 Employees</h3>
          <p className="summary-number">{filteredSummary.totalEmployees}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card present">
          <h3>✅ Present</h3>
          <p className="summary-number">{filteredSummary.totalPresent}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card absent">
          <h3>❌ Absent</h3>
          <p className="summary-number">{filteredSummary.totalAbsent}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card late">
          <h3>⚠️ Late</h3>
          <p className="summary-number">{filteredSummary.totalLate}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card leave">
          <h3>🌴 On Leave</h3>
          <p className="summary-number">{filteredSummary.totalOnLeave}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
      </div>

      {/* Employee Summary Table - with toggle */}
      {showEmployeeSummary && (
        <div className="employee-summary">
          <h3>Employee Summary</h3>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Days</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>On Leave</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(
                  attendanceRecords.reduce((acc, record) => {
                    const empId = record.employeeId;
                    if (!acc[empId]) {
                      acc[empId] = {
                        employeeName: record.employeeName,
                        total: 0,
                        present: 0,
                        absent: 0,
                        late: 0,
                        onLeave: 0
                      };
                    }
                    const status = getStatusBadge(record).text;
                    acc[empId].total++;
                    if (status === 'PRESENT') acc[empId].present++;
                    else if (status === 'ABSENT') acc[empId].absent++;
                    else if (status === 'LATE') acc[empId].late++;
                    else if (status === 'ON LEAVE') acc[empId].onLeave++;
                    return acc;
                  }, {})
                ).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table">No records found</td>
                  </tr>
                ) : (
                  Object.values(
                    attendanceRecords.reduce((acc, record) => {
                      const empId = record.employeeId;
                      if (!acc[empId]) {
                        acc[empId] = {
                          employeeName: record.employeeName,
                          total: 0,
                          present: 0,
                          absent: 0,
                          late: 0,
                          onLeave: 0
                        };
                      }
                      const status = getStatusBadge(record).text;
                      acc[empId].total++;
                      if (status === 'PRESENT') acc[empId].present++;
                      else if (status === 'ABSENT') acc[empId].absent++;
                      else if (status === 'LATE') acc[empId].late++;
                      else if (status === 'ON LEAVE') acc[empId].onLeave++;
                      return acc;
                    }, {})
                  ).map((emp, idx) => (
                    <tr key={idx}>
                      <td>{emp.employeeName}</td>
                      <td>{emp.total}</td>
                      <td className="present-cell">{emp.present}</td>
                      <td className="absent-cell">{emp.absent}</td>
                      <td className="late-cell">{emp.late}</td>
                      <td className="leave-cell">{emp.onLeave}</td>
                      <td>
                        {emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Attendance Table */}
      <div className="daily-attendance">
        <h3>Daily Attendance Records {weekFilter !== 'ALL' && `(Week ${weekFilter})`}</h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Week</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Tardiness</th>
                <th>Undertime</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-table">No attendance records found</td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => {
                  const status = getStatusBadge(record);
                  const weekNum = getWeekNumber(record.date);
                  return (
                    <tr key={idx} className={isFutureDate(record.date) ? 'future-row' : ''}>
                      <td>{record.employeeName}<br/><small>{record.employeeId}</small></td>
                      <td>{record.deptName}</td>
                      <td className={isFutureDate(record.date) ? 'future-date' : ''}>{record.date}</td>
                      <td className="week-cell">Week {weekNum}</td>
                      <td>{formatTime(record.clockInTime)}</td>
                      <td>{formatTime(record.clockOutTime)}</td>
                      <td>{record.schedArrangement || '-'}</td>
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
    </div>
  );
}

export default TeamAttendance;