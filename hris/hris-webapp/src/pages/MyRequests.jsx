// src/pages/MyRequests.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function MyRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    const result = await api.getMyRequests(user.id);
    if (result.success) {
      setRequests(result.requests);
    }
    setLoading(false);
  };

  const handleCancel = async (requestID) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      const result = await api.cancelRequest(requestID, user.id);
      if (result.success) {
        await loadRequests();
        alert(result.message);
      } else {
        alert(result.error);
      }
    }
  };

  const handleRecall = async (requestID) => {
    const reason = prompt('Please provide a reason for recalling this request:');
    if (reason === null) return;
    if (reason.trim() === '') {
      alert('Please provide a reason for recalling.');
      return;
    }
    
    if (window.confirm('Are you sure you want to recall this request?')) {
      const result = await api.recallRequest(requestID, user.id, reason);
      if (result.success) {
        await loadRequests();
        alert(result.message);
      } else {
        alert(result.error);
      }
    }
  };

  // Get display status for filtering
  const getDisplayStatus = (request) => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || 'PENDING';
  };

  // Get final approver display name
  const getFinalApproverName = (request) => {
    if (request.hrNameNotedBy) return request.hrNameNotedBy;
    if (request.finalApproverName) return request.finalApproverName;
    if (request.hrIdNotedBy) return `User ${request.hrIdNotedBy}`;
    return 'Pending';
  };

  // Determine if cancel or recall should be shown
  const getCancelAction = (request) => {
    if (request.regularStatus === 'PENDING') {
      return handleCancel;
    }
    if (request.regularStatus === 'NOTED' && request.hrStatus !== 'APPROVED') {
      return handleRecall;
    }
    return null;
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (filter === 'ALL') return true;
    return getDisplayStatus(req) === filter;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'createdAt' || sortField === 'date') {
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
      default: return '';
    }
  };

  const getCount = (status) => {
    return requests.filter(req => getDisplayStatus(req) === status).length;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="my-requests">
      <h2>📋 My Leave Requests</h2>
      
      <div className="filter-bar">
        <button onClick={() => setFilter('ALL')} className={filter === 'ALL' ? 'active' : ''}>
          All ({requests.length})
        </button>
        <button onClick={() => setFilter('PENDING')} className={filter === 'PENDING' ? 'active' : ''}>
          Pending ({getCount('PENDING')})
        </button>
        <button onClick={() => setFilter('NOTED')} className={filter === 'NOTED' ? 'active' : ''}>
          Noted ({getCount('NOTED')})
        </button>
        <button onClick={() => setFilter('APPROVED')} className={filter === 'APPROVED' ? 'active' : ''}>
          Approved ({getCount('APPROVED')})
        </button>
        <button onClick={() => setFilter('REJECT')} className={filter === 'REJECT' ? 'active' : ''}>
          Rejected ({getCount('REJECT')})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>Request ID {getSortIcon('id')}</th>
                <th>Date Range</th>
                <th onClick={() => handleSort('totalDays')}>Days {getSortIcon('totalDays')}</th>
                <th onClick={() => handleSort('leaveType')}>Leave Type {getSortIcon('leaveType')}</th>
                <th onClick={() => handleSort('regularStatus')}>Regular Status {getSortIcon('regularStatus')}</th>
                <th>Regular Approver</th>
                <th>Final Approver</th>
                <th>HR Status</th>
                <th onClick={() => handleSort('createdAt')}>Submitted {getSortIcon('createdAt')}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map(request => {
                const displayStatus = getDisplayStatus(request);
                const cancelAction = getCancelAction(request);
                const finalApproverName = getFinalApproverName(request);
                
                return (
                  <tr key={request.id}>
                    <td className="request-id-cell">{request.id}</td>
                    <td>{request.dateRange || request.date || '-'}</td>
                    <td className="days-cell">{request.totalDays || 1}</td>
                    <td>{request.leaveType || '-'}</td>
                    <td>
                      <span className={`status-badge-table ${getStatusBadgeClass(request.regularStatus)}`}>
                        {request.regularStatus || 'PENDING'}
                      </span>
                    </td>
                    <td>{request.approverName || '-'}</td>
                    <td>
                      {request.regularStatus === 'NOTED' ? finalApproverName : '-'}
                    </td>
                    <td>
                      {request.hrStatus && request.hrStatus !== 'PENDING' ? (
                        <span className={`status-badge-table ${getStatusBadgeClass(request.hrStatus)}`}>
                          {request.hrStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      {cancelAction && (
                        <button 
                          onClick={() => cancelAction(request.id)} 
                          className="action-btn-small"
                        >
                          {request.regularStatus === 'PENDING' ? 'Cancel' : 'Recall'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyRequests;