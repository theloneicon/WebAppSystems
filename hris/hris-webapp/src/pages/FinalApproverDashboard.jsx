// src/pages/FinalApproverDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function FinalApproverDashboard({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadPendingRequests();
  }, [user.id]);

  const loadPendingRequests = async () => {
    setLoading(true);
    const result = await api.getPendingFinalApprovals(user.id);
    if (result.success) {
      setPendingRequests(result.requests);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    if (window.confirm('Approve this leave request? This will be the final approval.')) {
      setProcessingId(requestId);
      const result = await api.approveFinalRequest(requestId, user.id, comments[requestId] || '');
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
    if (window.confirm('Reject this leave request? This will be final.')) {
      setProcessingId(requestId);
      const result = await api.rejectFinalRequest(requestId, user.id, comments[requestId] || '');
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

  // Simple helper at the top of the file
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) return <div className="loading">Loading pending approvals...</div>;

  return (
    <div className="leaves-approver-dashboard">
      <h2>🏆 Final Approvals</h2>
      <p>Requests waiting for your final decision ({pendingRequests.length})</p>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>✨ No pending requests for final approval</p>
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
                <th>Regular Approver</th>
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
                  <td>
                    {request.employeeName}
                    <br />
                    <small>{request.employeeID}</small>
                  </td>
                  <td>{request.deptName}</td>
                  <td>{request.dateRange || formatDate(request.date)}</td>
                  <td className="days-cell">{request.totalDays || 1}</td>
                  <td>{request.leaveType}</td>
                  <td>{request.regularApproverName}</td>
                  <td>{request.reason}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <textarea
                      value={comments[request.id] || ''}
                      onChange={(e) => updateComment(request.id, e.target.value)}
                      placeholder="Add remarks..."
                      rows="2"
                      className="comment-input"
                    />
                  </td>
                  <td>
                    <div className="action-buttons">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FinalApproverDashboard;