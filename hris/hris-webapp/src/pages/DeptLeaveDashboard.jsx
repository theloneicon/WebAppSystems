// src/pages/DeptLeaveDashboard.jsx
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

function DeptLeaveDashboard({ user }) {
  const [departmentRequests, setDepartmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadDepartmentRequests();
  }, [user.id]);

  const loadDepartmentRequests = async () => {
    setLoading(true);
    const result = await api.getDepartmentRequests(user.deptID, user.id);
    if (result.success) {
      setDepartmentRequests(result.requests);
    }
    setLoading(false);
  };

  // Get display status
  const getDisplayStatus = (request) => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || 'PENDING';
  };

  // Filter by status
  const filteredRequests = departmentRequests.filter(request => {
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

  const getStatusCount = (status) => {
    return departmentRequests.filter(r => getDisplayStatus(r) === status).length;
  };

  if (loading) return <div className="loading">Loading department requests...</div>;

  return (
    <div className="regular-approver-dashboard">
      <h2>📋 Department Leave Requests</h2>
      <p>Manage leave requests for {user.deptName} department</p>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Requests</h3>
          <p className="summary-number">{departmentRequests.length}</p>
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
          All ({departmentRequests.length})
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
              <th onClick={() => handleSort('hrNameNotedBy')}>HR Approval {getSortIcon('hrNameNotedBy')}</th>
              <th onClick={() => handleSort('hrActionDT')}>HR Action Date {getSortIcon('hrActionDT')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-table">
                  No requests found for this department
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

export default DeptLeaveDashboard; 