// src/pages/ApproverDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ApproverDashboard({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [comments, setComments] = useState({});
  const [showReasonModal, setShowReasonModal] = useState(null);

  useEffect(() => {
    loadPendingRequests();
  }, [user.id]);

  const loadPendingRequests = async () => {
    setLoading(true);
    const result = await api.getPendingRegularApprovals(user.id);
    if (result.success) {
      setPendingRequests(result.requests);
    }
    setLoading(false);
  };

  const handleNoted = async (requestId) => {
    if (window.confirm('Mark this request as NOTED? It will proceed to final approval.')) {
      setProcessingId(requestId);
      const result = await api.notedRequest(requestId, user.id, comments[requestId] || '');
      if (result.success) {
        alert('✅ Request noted and forwarded!');
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
      const result = await api.rejectRegularRequest(requestId, user.id, comments[requestId] || '');
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

  // Truncate text helper
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) return <div className="loading">Loading pending approvals...</div>;

  return (
    <div className="leaves-approver-dashboard">
      <h2>📋 Pending Approvals (Regular Approver)</h2>
      <p>Requests waiting for your review ({pendingRequests.length})</p>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>✨ No pending requests to review</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Date Range</th>
                <th>Days</th>
                <th>Leave Type</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(request => (
                <tr key={request.id}>
                  <td className="request-id-cell">{request.id}</td>
                  <td>{request.employeeName}<br/><small>{request.employeeID}</small></td>
                  <td>{request.deptName}</td>
                  <td>{request.dateRange || request.date}</td>
                  <td className="days-cell">{request.totalDays}</td>
                  <td>{request.leaveType}</td>
                  <td>
                    <div className="reason-cell">
                      <span className="reason-text">{truncateText(request.reason, 20)}</span>
                      {request.reason && request.reason.length > 20 && (
                        <button 
                          className="reason-popup-btn"
                          onClick={() => setShowReasonModal(request.id)}
                          title="View full reason"
                        >
                          📄
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <textarea
                      value={comments[request.id] || ''}
                      onChange={(e) => updateComment(request.id, e.target.value)}
                      placeholder="Add remarks..."
                      rows="1"
                      className="comment-input"
                    />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleNoted(request.id)} 
                        className="action-btn approve-btn-small"
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? '...' : '✅ Noted'}
                      </button>
                      <button 
                        onClick={() => handleReject(request.id)} 
                        className="action-btn reject-btn-small"
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? '...' : '❌ Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reason Popup Modal */}
      {showReasonModal && (
        <div className="modal-overlay" onClick={() => setShowReasonModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Full Reason</h3>
              <button className="modal-close" onClick={() => setShowReasonModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Request ID:</strong> {pendingRequests.find(r => r.id === showReasonModal)?.id}</p>
              <p><strong>Employee:</strong> {pendingRequests.find(r => r.id === showReasonModal)?.employeeName}</p>
              <div className="full-reason">
                {pendingRequests.find(r => r.id === showReasonModal)?.reason}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReasonModal(null)} className="modal-close-btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproverDashboard;