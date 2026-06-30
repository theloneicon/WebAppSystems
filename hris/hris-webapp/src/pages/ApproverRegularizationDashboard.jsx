// src/pages/ApproverRegularizationDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ApproverRegularizationDashboard({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [comments, setComments] = useState({});
  const [activeTab, setActiveTab] = useState('PENDING');
  const [showReasonModal, setShowReasonModal] = useState(null);

  // ⭐ Check if user has approver access
  const isApprover = user?.roleCateg === 'Approver07' || 
                      user?.roleCateg === 'Approver08' || 
                      user?.roleCateg === 'Approver09';

  useEffect(() => {
    if (isApprover) {
      loadPendingRequests();
      loadAllRequests();
    }
  }, [user.id]);

  const loadPendingRequests = async () => {
    setLoading(true);
    const result = await api.getPendingRegularizations(user.id);
    if (result.success) {
      setPendingRequests(result.requests);
    }
    setLoading(false);
  };

  const loadAllRequests = async () => {
    const result = await api.getMyRegularizationsForApprover(user.id);
    if (result.success) {
      setAllRequests(result.requests);
    }
  };

  const handleForReview = async (requestId) => {
    if (!window.confirm('Mark this request as FOR REVIEW? This will extend expiry by 7 days.')) return;
    
    setProcessingId(requestId);
    const result = await api.forReviewRegularization(requestId, user.id, comments[requestId] || '');
    if (result.success) {
      alert('✅ Request marked For Review. Expiration extended by 7 days.');
      await loadPendingRequests();
      await loadAllRequests();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this regularization request?')) return;
    
    setProcessingId(requestId);
    const result = await api.approveRegularization(requestId, user.id, comments[requestId] || '');
    if (result.success) {
      alert('✅ Request approved! Attendance records created.');
      await loadPendingRequests();
      await loadAllRequests();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this regularization request?')) return;
    
    setProcessingId(requestId);
    const result = await api.rejectRegularization(requestId, user.id, comments[requestId] || '');
    if (result.success) {
      alert('❌ Request rejected.');
      await loadPendingRequests();
      await loadAllRequests();
    } else {
      alert('❌ Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const updateComment = (requestId, value) => {
    setComments(prev => ({ ...prev, [requestId]: value }));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'FOR_REVIEW': return 'status-for-review';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELED': return 'status-canceled';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'PENDING': return 'PENDING';
      case 'FOR_REVIEW': return 'FOR REVIEW';
      case 'APPROVED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      case 'CANCELED': return 'CANCELED';
      default: return status || 'PENDING';
    }
  };

  const filteredRequests = activeTab === 'PENDING' ? pendingRequests : allRequests;

  if (!isApprover) {
    return (
      <div className="access-denied">
        <h2>⛔ Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="approver-regularization-dashboard">
      <h2>👑 Attendance Regularization - Approver</h2>
      <p className="subtitle">
        You are reviewing requests assigned to your Role ID: <strong>{user?.roleId}</strong>
      </p>

      {/* Tabs */}
      <div className="filter-tabs">
        <button 
          className={activeTab === 'PENDING' ? 'filter-active' : 'filter-btn'}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button 
          className={activeTab === 'ALL' ? 'filter-active' : 'filter-btn'}
          onClick={() => setActiveTab('ALL')}
        >
          All Requests ({allRequests.length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>✨ No {activeTab === 'PENDING' ? 'pending' : ''} requests to review</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => {
                const isPending = request.status === 'PENDING' || request.status === 'FOR_REVIEW';
                return (
                  <tr key={request.id}>
                    <td className="request-id-cell">{request.id}</td>
                    <td>{request.employeeName}<br/><small>{request.employeeID}</small></td>
                    <td>{request.date}</td>
                    <td>{request.clockIn || '-'}</td>
                    <td>{request.clockOut || '-'}</td>
                    <td>{request.reason}</td>
                    <td>
                      <span className={`status-badge-table ${getStatusBadge(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td>{request.expiredAt ? new Date(request.expiredAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <textarea
                        value={comments[request.id] || ''}
                        onChange={(e) => updateComment(request.id, e.target.value)}
                        placeholder="Add remarks..."
                        rows="2"
                        className="comment-input"
                        disabled={!isPending}
                      />
                    </td>
                    <td>
                      {isPending ? (
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleForReview(request.id)}
                            className="action-btn review-btn"
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? '...' : '🔄 Review'}
                          </button>
                          <button 
                            onClick={() => handleApprove(request.id)}
                            className="action-btn approve-btn-small"
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? '...' : '✅ Approve'}
                          </button>
                          <button 
                            onClick={() => handleReject(request.id)}
                            className="action-btn reject-btn-small"
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? '...' : '❌ Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="status-label">
                          {request.status === 'APPROVED' ? '✅ Done' : 
                           request.status === 'REJECTED' ? '❌ Closed' : 
                           '🔒 Locked'}
                        </span>
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

export default ApproverRegularizationDashboard;