// src/pages/AdminLeaveDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

function AdminLeaveDashboard({ user }) {
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

  // Get display status for grouping
  const getDisplayStatus = (request) => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || 'PENDING';
  };

  // Filter by status
  const filteredRequests = allRequests.filter(request => {
    if (statusFilter === 'ALL') return true;
    return getDisplayStatus(request) === statusFilter;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'createdAt' || sortField === 'date' || sortField === 'statusUpdateDT' || sortField === 'hrActionDT') {
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
      case 'NOTED': return 'status-noted';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'REJECT': return 'status-rejected';
      case 'CANCELED': return 'status-canceled';
      case 'CANCEL': return 'status-canceled';
      case 'RECALLED': return 'status-recalled';
      case 'RECALL': return 'status-recalled';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading all requests...</div>;

  // Count by display status
  const getStatusCount = (status) => {
    return allRequests.filter(r => getDisplayStatus(r) === status).length;
  };

  return (
    <div>
      <h2>🔧 Admin Leave Dashboard</h2>
      <p>Manage and monitor all leave requests across all departments</p>

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

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Requests</h3>
          <p className="summary-number">{allRequests.length}</p>
        </div>
        <div className="summary-card pending">
          <h3>Pending</h3>
          <p className="summary-number">{getStatusCount('PENDING')}</p>
        </div>
        <div className="summary-card noted">
          <h3>Noted</h3>
          <p className="summary-number">{getStatusCount('NOTED')}</p>
        </div>
        <div className="summary-card approved">
          <h3>Approved</h3>
          <p className="summary-number">{getStatusCount('APPROVED')}</p>
        </div>
        <div className="summary-card rejected">
          <h3>Rejected</h3>
          <p className="summary-number">{getStatusCount('REJECTED')}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={statusFilter === 'ALL' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({allRequests.length})
        </button>
        <button 
          className={statusFilter === 'PENDING' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending ({getStatusCount('PENDING')})
        </button>
        <button 
          className={statusFilter === 'NOTED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('NOTED')}
        >
          Noted ({getStatusCount('NOTED')})
        </button>
        <button 
          className={statusFilter === 'APPROVED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('APPROVED')}
        >
          Approved ({getStatusCount('APPROVED')})
        </button>
        <button 
          className={statusFilter === 'REJECTED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected ({getStatusCount('REJECTED')})
        </button>
        <button 
          className={statusFilter === 'CANCELED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('CANCELED')}
        >
          Canceled ({getStatusCount('CANCELED')})
        </button>
        <button 
          className={statusFilter === 'RECALLED' ? 'filter-active' : 'filter-btn'}
          onClick={() => setStatusFilter('RECALLED')}
        >
          Recalled ({getStatusCount('RECALLED')})
        </button>
      </div>

      {/* Results Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>Request ID {getSortIcon('id')}</th>
              <th onClick={() => handleSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
              <th onClick={() => handleSort('employeeName')}>Employee {getSortIcon('employeeName')}</th>
              <th>Date Range</th>
              <th onClick={() => handleSort('totalDays')}>Days {getSortIcon('totalDays')}</th>
              <th onClick={() => handleSort('leaveType')}>Leave Type {getSortIcon('leaveType')}</th>
              <th onClick={() => handleSort('regularStatus')}>Regular Status {getSortIcon('regularStatus')}</th>
              <th onClick={() => handleSort('approverName')}>Regular Approver {getSortIcon('approverName')}</th>
              <th onClick={() => handleSort('statusUpdateDT')}>Status Update {getSortIcon('statusUpdateDT')}</th>
              <th onClick={() => handleSort('hrStatus')}>HR Status {getSortIcon('hrStatus')}</th>
              <th onClick={() => handleSort('hrNameNotedBy')}>HR Noted By {getSortIcon('hrNameNotedBy')}</th>
              <th onClick={() => handleSort('hrActionDT')}>HR Action Date {getSortIcon('hrActionDT')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-table">
                  No requests found
                </td>
              </tr>
            ) : (
              sortedRequests.map(request => {
                const displayStatus = getDisplayStatus(request);
                return (
                  <tr key={request.id}>
                    <td className="request-id-cell">{request.id}</td>
                    <td>{request.createdAt ? formatDateTime(request.createdAt) : '-'}</td>
                    <td>{request.employeeName} ({request.employeeID})</td>
                    <td>{request.dateRange || formatDate(request.date) || '-'}</td>
                    <td className="days-cell">{request.totalDays || 1}</td>
                    <td>{request.leaveType || '-'}</td>
                    <td>
                      <span className={`status-badge-table ${getStatusBadgeClass(request.regularStatus)}`}>
                        {request.regularStatus || 'PENDING'}
                      </span>
                    </td>
                    <td>{request.approverName || request.regularApproverName || '-'}</td>
                    <td>{request.statusUpdateDT ? formatDateTime(request.statusUpdateDT) : '-'}</td>
                    <td>
                      {request.hrStatus && request.hrStatus !== 'PENDING' ? (
                        <span className={`status-badge-table ${getStatusBadgeClass(request.hrStatus)}`}>
                          {request.hrStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{request.hrNameNotedBy || '-'}</td>
                    <td>{request.hrActionDT ? formatDateTime(request.hrActionDT) : '-'}</td>
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

export default AdminLeaveDashboard;