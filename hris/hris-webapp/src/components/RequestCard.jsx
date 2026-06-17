// src/components/RequestCard.jsx
function RequestCard({ request, onCancel }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'NOTED': return 'status-noted';
      case 'APPROVED': return 'status-approved';
      case 'REJECT': return 'status-rejected';
      case 'REJECTED': return 'status-rejected';
      case 'CANCEL': return 'status-canceled';
      case 'CANCELED': return 'status-canceled';
      case 'RECALL': return 'status-recalled';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get display status
  const getDisplayStatus = () => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || request.status || 'PENDING';
  };

  const displayStatus = getDisplayStatus();

  return (
    <div className={`request-card ${getStatusColor(displayStatus)}`}>
      <div className="request-header">
        <span className="request-id">{request.id}</span>
        <span className={`status-badge ${displayStatus.toLowerCase()}`}>
          {displayStatus}
        </span>
      </div>
      
      <div className="request-body">
        <div className="request-dates">
          <span>📅 {request.dateRange || request.date || 'Date not specified'}</span>
          <span>{request.totalDays || request.dates?.length || 1} day(s)</span>
        </div>
        <div className="request-leavetype">
          <strong>Leave Type:</strong> {request.leaveType || request.VLTtype || 'Not specified'}
        </div>
        <div className="request-reason">
          <strong>Reason:</strong> {request.reason}
        </div>
        <div className="request-approver">
          <strong>Approver:</strong> {request.approverName}
        </div>
        <div className="request-created">
          <small>Submitted: {formatDate(request.createdAt)}</small>
          {request.expiresAt && new Date(request.expiresAt) > new Date() && (
            <small> Expires: {formatDate(request.expiresAt)}</small>
          )}
        </div>
        {request.hrStatus === 'NOTED' && (
          <div className="hr-note">
            ✅ Noted by HR
          </div>
        )}
        {request.comment && (
          <div className="request-comments">
            <small>Comment: {request.comment}</small>
          </div>
        )}
      </div>
      
      {onCancel && (
        <div className="request-actions">
          <button onClick={() => onCancel(request.id)} className="cancel-btn">
            ❌ Cancel Request
          </button>
        </div>
      )}
    </div>
  );
}

export default RequestCard;