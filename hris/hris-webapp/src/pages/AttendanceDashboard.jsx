// src/pages/AttendanceDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function AttendanceDashboard({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [excuseModal, setExcuseModal] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    const result = await api.getAttendanceByDate(selectedDate);
    if (result.success) {
      setAttendance(result.records);
    }
    setLoading(false);
  };

  const handleExcuse = async (recordId, type, reference) => {
    const reason = prompt('Enter reference (Leave ID or Regularization ID):');
    if (!reason) return;

    const result = await api.excuseViolation(recordId, type, reason, user.id);
    if (result.success) {
      alert('✅ Violation excused!');
      loadAttendance();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setExcuseModal(null);
  };

  const calculateTardyDisplay = (record) => {
    if (!record.tardinessMinutes || record.tardinessMinutes === 0) return '-';
    if (record.isTardyExcused) return `${record.tardinessMinutes} min (EXCUSED)`;
    return `${record.tardinessMinutes} min`;
  };

  const calculateUndertimeDisplay = (record) => {
    if (!record.undertimeMinutes || record.undertimeMinutes === 0) return '-';
    if (record.isUndertimeExcused) return `${record.undertimeMinutes} min (EXCUSED)`;
    return `${record.undertimeMinutes} min`;
  };

  const getStatusBadge = (record) => {
    if (record.isOnLeave) return <span className="status-badge-table status-leave">ON LEAVE</span>;
    if (!record.clockInTime) return <span className="status-badge-table status-absent">ABSENT</span>;
    if (record.clockInTime && !record.clockOutTime) return <span className="status-badge-table status-in">CLOCKED IN</span>;
    return <span className="status-badge-table status-complete">COMPLETE</span>;
  };


  const formatDisplayTime = (timeString) => {
  if (!timeString) return '-';
  // If it's in ISO format, extract the time part
  if (timeString.includes('T')) {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return timeString;
};


  if (loading) return <div className="loading">Loading attendance...</div>;

  return (
    <div className="attendance-dashboard">
      <h1>📊 Attendance Dashboard</h1>
      
      <div className="date-selector">
        <label>Select Date:</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={loadAttendance}>Refresh</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
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
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table">No attendance records found</td>
              </tr>
            ) : (
              attendance.map(record => (
                <tr key={record.employeeId}>
                  <td>{record.employeeName}<br/><small>{record.employeeId}</small></td>
                  <td>{record.deptName}</td>
                  <td>{record.schedArrangement}<br/><small>{formatDisplayTime(record.scheduleStart)} - {formatDisplayTime(record.scheduleEnd)}</small></td>
                  <td>{record.clockInTime || '-'}</td>
                  <td>{record.clockOutTime || '-'}</td>
                  <td>{getStatusBadge(record)}</td>
                  <td className={record.tardinessMinutes > 0 && !record.isTardyExcused ? 'violation-cell' : ''}>
                    {calculateTardyDisplay(record)}
                    {record.tardinessMinutes > 0 && !record.isTardyExcused && (
                      <button 
                        onClick={() => handleExcuse(record.recordId, 'TARDINESS', '')}
                        className="excuse-btn-small"
                      >
                        Excuse
                      </button>
                    )}
                  </td>
                  <td className={record.undertimeMinutes > 0 && !record.isUndertimeExcused ? 'violation-cell' : ''}>
                    {calculateUndertimeDisplay(record)}
                    {record.undertimeMinutes > 0 && !record.isUndertimeExcused && (
                      <button 
                        onClick={() => handleExcuse(record.recordId, 'UNDERTIME', '')}
                        className="excuse-btn-small"
                      >
                        Excuse
                      </button>
                    )}
                  </td>
                  <td>
                    {record.isOnLeave && record.leaveReference && (
                      <small>Ref: {record.leaveReference}</small>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Present Today</h3>
          <p className="summary-number">{attendance.filter(r => r.clockInTime).length}</p>
        </div>
        <div className="summary-card absent">
          <h3>Absent</h3>
          <p className="summary-number">{attendance.filter(r => !r.clockInTime && !r.isOnLeave).length}</p>
        </div>
        <div className="summary-card leave">
          <h3>On Leave</h3>
          <p className="summary-number">{attendance.filter(r => r.isOnLeave).length}</p>
        </div>
        <div className="summary-card tardy">
          <h3>Tardy</h3>
          <p className="summary-number">{attendance.filter(r => r.tardinessMinutes > 0 && !r.isTardyExcused).length}</p>
        </div>
      </div>
    </div>
  );
}

export default AttendanceDashboard;