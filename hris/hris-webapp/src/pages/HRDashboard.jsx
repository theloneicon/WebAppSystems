// src/pages/HRDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function HRDashboard({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const result = await api.getPendingHRNotifications();
    if (result.success) {
      setNotifications(result.notifications);
    }
    setLoading(false);
  };

  const handleMarkAsNoted = async (requestId, type) => {
    if (window.confirm(`Mark this ${type} request as NOTED?`)) {
      const result = await api.markAsNoted(requestId, type, user.id, user.name);
      if (result.success) {
        alert('✅ Request marked as NOTED');
        loadNotifications();
      } else {
        alert('❌ Error: ' + result.error);
      }
    }
  };

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  const pendingLeave = notifications.filter(n => n.type === 'LEAVE' && n.hr_status === 'PENDING');
  const pendingRegularization = notifications.filter(n => n.type === 'REGULARIZATION' && n.hr_status === 'PENDING');

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="hr-dashboard">
      <h1>🔧 HR Dashboard</h1>
      <p>Manage and acknowledge approved requests</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{pendingLeave.length}</h3>
          <p>Pending Leave Notifications</p>
        </div>
        <div className="stat-card">
          <h3>{pendingRegularization.length}</h3>
          <p>Pending Regularization Notifications</p>
        </div>
        <div className="stat-card">
          <h3>{notifications.filter(n => n.hr_status === 'NOTED').length}</h3>
          <p>Already Noted</p>
        </div>
      </div>

      <div className="filter-tabs">
        <button className={filter === 'ALL' ? 'filter-active' : 'filter-btn'} onClick={() => setFilter('ALL')}>
          All ({notifications.length})
        </button>
        <button className={filter === 'LEAVE' ? 'filter-active' : 'filter-btn'} onClick={() => setFilter('LEAVE')}>
          Leave Requests ({pendingLeave.length})
        </button>
        <button className={filter === 'REGULARIZATION' ? 'filter-active' : 'filter-btn'} onClick={() => setFilter('REGULARIZATION')}>
          Regularizations ({pendingRegularization.length})
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Request ID</th>
              <th>Employee</th>
              <th>Details</th>
              <th>Approver</th>
              <th>HR Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table">No notifications found</td>
              </tr>
            ) : (
              filteredNotifications.map(item => (
                <tr key={item.requestId}>
                  <td>
                    <span className={`type-badge ${item.type === 'LEAVE' ? 'leave' : 'reg'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.requestId}</td>
                  <td>{item.employeeName}<br/><small>{item.employeeId}</small></td>
                  <td>
                    {item.type === 'LEAVE' ? (
                      <>
                        <strong>Date:</strong> {item.date}<br/>
                        <strong>Type:</strong> {item.leaveRenderType} ({item.credit} day)<br/>
                        <strong>Leave Type:</strong> {item.leaveType}
                      </>
                    ) : (
                      <>
                        <strong>Date:</strong> {item.date}<br/>
                        <strong>Hours:</strong> {item.clockIn} - {item.clockOut}<br/>
                        <strong>Total:</strong> {item.totalHours} hours
                      </>
                    )}
                  </td>
                  <td>{item.approverName}</td>
                  <td>
                    <span className={`hr-status ${item.hr_status === 'NOTED' ? 'noted' : 'pending'}`}>
                      {item.hr_status === 'NOTED' ? '✓ NOTED' : '⏳ PENDING'}
                    </span>
                  </td>
                  <td>
                    {item.hr_status !== 'NOTED' && (
                      <button onClick={() => handleMarkAsNoted(item.requestId, item.type)} className="noted-btn">
                        Mark as NOTED
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HRDashboard;