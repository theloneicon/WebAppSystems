// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function AdminDashboard({ user }) {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [todaysStats, setTodaysStats] = useState({ newPending: 0, newApproved: 0 });

  useEffect(() => {
    loadAllRequests();
    loadTodaysStats();
  }, []);

  const loadAllRequests = async () => {
    setLoading(true);
    const result = await api.getAllRequests();
    if (result.success) {
      setAllRequests(result.requests);
    }
    setLoading(false);
  };

  const loadTodaysStats = async () => {
    const result = await api.getTodaysStats();
    if (result.success) {
      setTodaysStats(result);
    }
  };

  // Filter by status
  const filteredRequests = allRequests.filter(request => {
    if (statusFilter === 'ALL') return true;
    return request.status === statusFilter;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'createdAt' || sortField === 'startDate' || sortField === 'endDate') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELED': return 'status-canceled';
      case 'RECALLED': return 'status-recalled';
      default: return '';
    }
  };

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];  // "2026-06-10"
  };  

  if (loading) return <div className="loading">Loading all requests...</div>;

  return (
    <div className="admin-dashboard">
      <h1>🔧 Admin Dashboard</h1>
      <p>Manage and monitor all leave requests</p>

      {/* Notification Banner - Today's Activity */}
      <div className="notification-banner">
        <div className="notification-icon">📅</div>
        <div className="notification-content">
          <h3>Today's Activity ({new Date().toLocaleDateString()})</h3>
          <div className="notification-stats">
            <div className="notification-stat pending">
              <span className="stat-number">{todaysStats.newPending}</span>
              <span className="stat-label">New Pending Request{todaysStats.newPending !== 1 ? 's' : ''}</span>
            </div>
            <div className="notification-stat approved">
              <span className="stat-number">{todaysStats.newApproved}</span>
              <span className="stat-label">New Approved Request{todaysStats.newApproved !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={statusFilter === 'ALL' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({allRequests.length})
        </button>&nbsp;
        <button 
          className={statusFilter === 'PENDING' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending ({allRequests.filter(r => r.status === 'PENDING').length})
        </button>&nbsp;
        <button 
          className={statusFilter === 'APPROVED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('APPROVED')}
        >
          Approved ({allRequests.filter(r => r.status === 'APPROVED').length})
        </button>&nbsp;
        <button 
          className={statusFilter === 'REJECTED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected ({allRequests.filter(r => r.status === 'REJECTED').length})
        </button>&nbsp;
        <button 
          className={statusFilter === 'CANCELED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('CANCELED')}
        >
          Canceled ({allRequests.filter(r => r.status === 'CANCELED').length})
        </button>&nbsp;
        <button 
          className={statusFilter === 'RECALLED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('RECALLED')}
        >
          Recalled ({allRequests.filter(r => r.status === 'RECALLED').length})
        </button>
      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>Request ID {getSortIcon('id')}</th>
              <th onClick={() => handleSort('employeeName')}>Employee {getSortIcon('employeeName')}</th>
              <th onClick={() => handleSort('startDate')}>Start Date {getSortIcon('startDate')}</th>
              <th onClick={() => handleSort('endDate')}>End Date {getSortIcon('endDate')}</th>
              <th onClick={() => handleSort('totalDays')}>Days {getSortIcon('totalDays')}</th>
              <th onClick={() => handleSort('leaveType')}>Type {getSortIcon('leaveType')}</th>
              <th onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
              <th onClick={() => handleSort('approverName')}>Approver {getSortIcon('approverName')}</th>
              <th onClick={() => handleSort('createdAt')}>Submitted {getSortIcon('createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table">
                  No requests found
                </td>
              </tr>
            ) : (
              sortedRequests.map(request => (
                <tr key={request.id}>
                  <td className="request-id-cell">{request.id}</td>
                  <td>{request.employeeName} ({request.employeeID})</td>
                  <td>{formatDate(request.startDate) || '-'}</td>
                  <td>{formatDate(request.endDate) || '-'}</td>
                  <td className="days-cell">{request.totalDays}</td>
                  <td>{request.leaveType || '-'}</td>
                  <td>
                    <span className={`status-badge-table ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{request.approverName || '-'}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Requests</h3>
          <p className="summary-number">{allRequests.length}</p>
        </div>
        <div className="summary-card pending">
          <h3>Pending</h3>
          <p className="summary-number">{allRequests.filter(r => r.status === 'PENDING').length}</p>
        </div>
        <div className="summary-card approved">
          <h3>Approved</h3>
          <p className="summary-number">{allRequests.filter(r => r.status === 'APPROVED').length}</p>
        </div>
        <div className="summary-card rejected">
          <h3>Rejected</h3>
          <p className="summary-number">{allRequests.filter(r => r.status === 'REJECTED').length}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;