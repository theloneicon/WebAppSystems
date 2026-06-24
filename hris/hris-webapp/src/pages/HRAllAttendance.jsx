// src/pages/HRAllAttendance.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function HRAllAttendance({ user }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [weekFilter, setWeekFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(''); // ⭐ NEW: Search state
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

  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getStatusBadge = (record) => {
    // Check if date is in the future
    if (isFutureDate(record.date)) {
      return { text: 'UPCOMING', class: 'status-upcoming', icon: '📅' };
    }
    
    // Check if it's a weekend
    if (isWeekend(record.date)) {
      if (record.clockInTime && record.clockOutTime) {
        return { text: 'COMPLETE', class: 'status-complete', icon: '✅' };
      }
      if (record.clockInTime && !record.clockOutTime) {
        return { text: 'INCOMPLETE', class: 'status-incomplete', icon: '🕐' };
      }
      return { text: 'WEEKEND', class: 'status-weekend', icon: '📅' };
    }
    
    // Regular weekday logic
    if (record.isOnLeave) return { text: 'ON LEAVE', class: 'status-leave', icon: '🌴' };
    if (!record.clockInTime) return { text: 'ABSENT', class: 'status-absent', icon: '❌' };
    if (record.clockInTime && !record.clockOutTime) return { text: 'INCOMPLETE', class: 'status-incomplete', icon: '🕐' };
    if (record.tardinessMinutes > 0 && !record.isTardyExcused) {
      return { text: 'LATE', class: 'status-late', icon: '⚠️' };
    }
    if (record.undertimeMinutes > 0 && !record.isUndertimeExcused) {
      return { text: 'UNDERTIME', class: 'status-undertime', icon: '⏳' };
    }
    return { text: 'COMPLETE', class: 'status-complete', icon: '✅' };
  };

  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = firstDay.getDay();
    const adjustedFirstDay = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;
    const weekNum = Math.ceil((dayOfMonth + adjustedFirstDay) / 7);
    return weekNum;
  };

  // ⭐ NEW: Check if record matches search term
  const matchesSearch = (record) => {
    if (!searchTerm || searchTerm.trim() === '') return true;
    
    const term = searchTerm.toLowerCase().trim();
    
    // Search in multiple fields
    const searchableFields = [
      record.employeeName || '',
      record.employeeId || '',
      record.deptName || '',
      record.schedArrangement || '',
      record.date || '',
      record.clockInTime || '',
      record.clockOutTime || '',
    ];
    
    return searchableFields.some(field => 
      field.toLowerCase().includes(term)
    );
  };

  // Get filtered records based on all filters
  const getFilteredRecords = () => {
    let result = [...attendanceRecords];
    
    // ⭐ Search filter
    if (searchTerm && searchTerm.trim() !== '') {
      result = result.filter(record => matchesSearch(record));
    }
    
    // Department filter
    if (departmentFilter !== 'ALL') {
      result = result.filter(r => r.deptName === departmentFilter);
    }
    
    // Week filter
    if (weekFilter !== 'ALL') {
      result = result.filter(r => getWeekNumber(r.date) === parseInt(weekFilter));
    }
    
    // Upcoming filter
    if (!showUpcoming) {
      result = result.filter(record => !isFutureDate(record.date));
    }
    
    // Weekend filter
    if (!showWeekend) {
      result = result.filter(record => !isWeekend(record.date));
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(r => getStatusBadge(r).text === statusFilter);
    }
    
    return result;
  };

  const filteredRecords = getFilteredRecords();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'COMPLETE', label: '✅ Complete' },
    { value: 'ABSENT', label: '❌ Absent' },
    { value: 'INCOMPLETE', label: '🕐 Incomplete' },
    { value: 'ON LEAVE', label: '🌴 On Leave' },
    { value: 'LATE', label: '⚠️ Late' },
    { value: 'UNDERTIME', label: '⏳ Undertime' },
    { value: 'WEEKEND', label: '📅 Weekend' },
    { value: 'UPCOMING', label: '📅 Upcoming' },
  ];

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const pastRecords = filteredRecords.filter(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate <= currentDate;
  });

  const futureCount = attendanceRecords.filter(record => isFutureDate(record.date)).length;
  const weekendCount = attendanceRecords.filter(record => isWeekend(record.date)).length;
  const totalEmployees = new Set(attendanceRecords.map(r => r.employeeId)).size;

  // Calculate summary
  const totalDays = pastRecords.length;
  const completeDays = pastRecords.filter(r => {
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
  const lateDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'LATE';
  }).length;
  const undertimeDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'UNDERTIME';
  }).length;
  const weekendDays = pastRecords.filter(r => {
    const status = getStatusBadge(r).text;
    return status === 'WEEKEND';
  }).length;

  const totalTardiness = pastRecords.reduce((sum, r) => sum + (r.tardinessMinutes || 0), 0);
  const totalUndertime = pastRecords.reduce((sum, r) => sum + (r.undertimeMinutes || 0), 0);

  // Department summary with all statuses
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
        late: 0,
        undertime: 0,
        weekend: 0
      };
    }
    const status = getStatusBadge(record).text;
    deptSummary[dept].total++;
    if (status === 'COMPLETE') deptSummary[dept].complete++;
    else if (status === 'ABSENT') deptSummary[dept].absent++;
    else if (status === 'ON LEAVE') deptSummary[dept].onLeave++;
    else if (status === 'INCOMPLETE') deptSummary[dept].incomplete++;
    else if (status === 'LATE') deptSummary[dept].late++;
    else if (status === 'UNDERTIME') deptSummary[dept].undertime++;
    else if (status === 'WEEKEND') deptSummary[dept].weekend++;
  });

  // Get week summary for the week cards
  const getWeekSummary = (records, week) => {
    const weekRecords = records.filter(r => getWeekNumber(r.date) === parseInt(week));
    const total = weekRecords.length;
    const complete = weekRecords.filter(r => getStatusBadge(r).text === 'COMPLETE').length;
    const absent = weekRecords.filter(r => getStatusBadge(r).text === 'ABSENT').length;
    const late = weekRecords.filter(r => getStatusBadge(r).text === 'LATE').length;
    const onLeave = weekRecords.filter(r => getStatusBadge(r).text === 'ON LEAVE').length;
    const incomplete = weekRecords.filter(r => getStatusBadge(r).text === 'INCOMPLETE').length;
    const undertime = weekRecords.filter(r => getStatusBadge(r).text === 'UNDERTIME').length;
    const weekend = weekRecords.filter(r => getStatusBadge(r).text === 'WEEKEND').length;
    return { total, complete, absent, late, onLeave, incomplete, undertime, weekend };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status count for filter tabs
  const getStatusCount = (status) => {
    return attendanceRecords.filter(r => getStatusBadge(r).text === status).length;
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    const formatted = parseFloat(minutes.toFixed(2));
    return `${formatted} min`;
  };

  // ⭐ NEW: Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

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
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({getStatusCount(option.value)})
                </option>
              ))}
            </select>
          </div>
          {/* ⭐ NEW: Search Box */}
          <div className="filter-group search-group">
            <label>🔍 Search:</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search employee, ID, dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  onClick={clearSearch} 
                  className="search-clear-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <button onClick={loadAllAttendance} className="refresh-btn">Refresh</button>
        </div>

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

      {/* ⭐ NEW: Search results count */}
      {searchTerm && (
        <div className="search-results-info">
          Found <strong>{filteredRecords.length}</strong> record(s) for "{searchTerm}"
          {filteredRecords.length === 0 && (
            <span className="no-results"> - No matches found</span>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="attendance-summary">
        <div className="summary-card">
          <h3>👥 Employees</h3>
          <p className="summary-number">{totalEmployees}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card complete">
          <h3>✅ Complete</h3>
          <p className="summary-number">{completeDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card absent">
          <h3>❌ Absent</h3>
          <p className="summary-number">{absentDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card leave">
          <h3>🌴 On Leave</h3>
          <p className="summary-number">{leaveDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card incomplete">
          <h3>🕐 Incomplete</h3>
          <p className="summary-number">{incompleteDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card late">
          <h3>⚠️ Late</h3>
          <p className="summary-number">{lateDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
        <div className="summary-card undertime">
          <h3>⏳ Undertime</h3>
          <p className="summary-number">{undertimeDays}</p>
          {weekFilter !== 'ALL' && (
            <small className="filter-hint">Week {weekFilter}</small>
          )}
        </div>
      </div>

      {/* Week Summary Table */}
      <div className="week-summary-table-container">
        <table className="week-summary-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>✅ Complete</th>
              <th>❌ Absent</th>
              <th>⚠️ Late</th>
              <th>🌴 On Leave</th>
              <th>🕐 Incomplete</th>
              <th>⏳ Undertime</th>
            </tr>
          </thead>
          <tbody>
            {['1', '2', '3', '4', '5'].map(week => {
              const summary = getWeekSummary(attendanceRecords, week);
              if (summary.total === 0) return null;
              return (
                <tr 
                  key={week} 
                  className={`week-summary-row ${weekFilter === week ? 'active' : ''}`}
                  onClick={() => setWeekFilter(week)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="week-label">Week {week}</td>
                  <td className="complete-cell">{summary.complete}</td>
                  <td className="absent-cell">{summary.absent}</td>
                  <td className="late-cell">{summary.late}</td>
                  <td className="leave-cell">{summary.onLeave}</td>
                  <td className="incomplete-cell">{summary.incomplete}</td>
                  <td className="undertime-cell">{summary.undertime || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
                <th>⚠️ Late</th>
                <th>⏳ Undertime</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(deptSummary).length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-table">No records found</td>
                </tr>
              ) : (
                Object.entries(deptSummary).map(([dept, data]) => (
                  <tr key={dept}>
                    <td>{dept}</td>
                    <td>{data.total}</td>
                    <td className="complete-cell">{data.complete}</td>
                    <td className="absent-cell">{data.absent}</td>
                    <td className="leave-cell">{data.onLeave}</td>
                    <td className="incomplete-cell">{data.incomplete}</td>
                    <td className="late-cell">{data.late}</td>
                    <td className="undertime-cell">{data.undertime}</td>
                    <td>
                      {data.total > 0 ? Math.round((data.complete / (data.total - data.weekend)) * 100) : 0}%
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
          <span className="violation-value">{formatMinutes(totalTardiness)} </span>
        </div>
        <div className="violation-card">
          <span className="violation-label">Total Undertime:</span>
          <span className="violation-value">{formatMinutes(totalUndertime)} </span>
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
              <th>Day</th>
              <th>Shift</th>
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
                <td colSpan="11" className="empty-table">
                  {searchTerm ? 'No records match your search' : 'No attendance records found'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, idx) => {
                const status = getStatusBadge(record);
                const shiftType = record.isNightShift ? '🌙 Night' : '☀️ Day';
                const displayDate = record.shiftDate || record.date;
                const isWeekendDay = isWeekend(record.date);
                const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <tr key={idx} className={isFutureDate(displayDate) ? 'future-row' : ''}>
                    <td>
                      {record.employeeName}
                      <br />
                      <small>{record.employeeId}</small>
                    </td>
                    <td>{record.deptName}</td>
                    <td className={isFutureDate(displayDate) ? 'future-date' : ''}>{formatDate(displayDate)}</td>
                    <td className={isWeekendDay ? 'weekend-day' : ''}>{dayName}</td>
                    <td className="shift-cell">{shiftType}</td>
                    <td>{record.schedArrangement || '-'}</td>
                    <td>{formatTime(record.clockInTime)}</td>
                    <td>{formatTime(record.clockOutTime)}</td>
                    <td>
                      <span className={`status-badge-table ${status.class}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className={record.tardinessMinutes > 0 && !record.isTardyExcused && !isFutureDate(displayDate) ? 'violation-cell' : ''}>
                      {record.tardinessMinutes > 0 && !isFutureDate(displayDate) ? `${formatMinutes(record.tardinessMinutes)}` : '-'}
                    </td>
                    <td className={record.undertimeMinutes > 0 && !record.isUndertimeExcused && !isFutureDate(displayDate) ? 'violation-cell' : ''}>
                      {record.undertimeMinutes > 0 && !isFutureDate(displayDate) ? `${formatMinutes(record.undertimeMinutes)}` : '-'}
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