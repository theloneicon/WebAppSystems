// src/pages/ApproverDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';


const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

function ApproverDashboard({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadPendingRequests();
  }, [user.id]);

  const loadPendingRequests = async () => {
    setLoading(true);
    const result = await api.getPendingApprovals(user.id, user.aprvLevel);
    if (result.success) {
      setPendingRequests(result.requests);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    if (window.confirm('Approve this leave request?')) {
      setProcessingId(requestId);
      const result = await api.approveRequest(requestId, user.id, comments[requestId] || '');
      if (result.success) {
        alert('✅ Request approved successfully!');
        await loadPendingRequests();
      } else {
        alert('❌ Error: ' + result.error);
      }
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (window.confirm('Reject this leave request?')) {
      setProcessingId(requestId);
      const result = await api.rejectRequest(requestId, user.id, comments[requestId] || '');
      if (result.success) {
        alert('❌ Request rejected');
        await loadPendingRequests();
      } else {
        alert('❌ Error: ' + result.error);
      }
      setProcessingId(null);
    }
  };

  const updateComment = (requestId, value) => {
    setComments(prev => ({ ...prev, [requestId]: value }));
  };

  if (loading) return <div className="loading">Loading pending approvals...</div>;

  return (
    <div className="approver-dashboard">
      <h1>📋 Pending Approvals</h1>
      <p>Requests waiting for your approval ({pendingRequests.length})</p>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>✨ No pending requests to review</p>
        </div>
      ) : (
        <div className="requests-list">
          {pendingRequests.map(request => (
            <div key={request.id} className="request-card pending">
              <div className="request-header">
                <span className="request-id">{request.id}</span>
                <span className="status-badge pending">PENDING</span>
              </div>
              
              <div className="request-body">
                <div className="request-dates">
                  <span>📅 {formatDate(request.startDate)} → {formatDate(request.endDate)}</span>
                  <span>{request.totalDays} days</span>
                </div>
                <div className="request-reason">
                  <strong>Employee:</strong> {request.employeeName} ({request.employeeID})
                </div>
                <div className="request-reason">
                  <strong>Department:</strong> {request.deptName}
                </div>
                <div className="request-reason">
                  <strong>Leave Type:</strong> {request.leaveType}
                </div>                
                <div className="request-reason">
                  <strong>Reason:</strong> {request.reason}
                </div>
                <div className="request-created">
                  <small>Submitted: {new Date(request.createdAt).toLocaleString()}</small>
                </div>            
                {request.totalDays && (
                  <div className="request-comments">
                  <small> Total Day(s): {request.totalDays}</small>
                  </div>
                )} 
                <div className="form-group">
                  <label>Comments (optional):</label>
                  <textarea
                    value={comments[request.id] || ''}
                    onChange={(e) => updateComment(request.id, e.target.value)}
                    placeholder="Add any notes or remarks..."
                    rows="2"
                  />
                </div>
              </div>
              
              <div className="request-actions">
                <button 
                  onClick={() => handleApprove(request.id)} 
                  className="approve-btn"
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? 'Processing...' : '✅ Approve'}
                </button>
                &nbsp;
                
                <button 
                  onClick={() => handleReject(request.id)} 
                  className="reject-btn"
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? 'Processing...' : '❌ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApproverDashboard;