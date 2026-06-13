// src/components/RequestCard.jsx
function RequestCard({ request, onCancel }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELED': return 'status-canceled';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCredit = (credit, leaveRenderType) => {
    if (leaveRenderType === 'FULL') return 'Full Day (1.0 day)';
    if (leaveRenderType === '1ST_HALF') return '1st Half - AM (0.5 day)';
    if (leaveRenderType === '2ND_HALF') return '2nd Half - PM (0.5 day)';
    return `${credit || 0} day(s)`;
  };

  const displayDate = request.date || request.startDate;

  return (
    <div className={`request-card ${getStatusColor(request.status)}`}>
      <div className="request-header">
        <span className="request-id">{request.id}</span>
        <span className={`status-badge ${request.status?.toLowerCase()}`}>
          {request.status}
        </span>
      </div>
      
      <div className="request-body">
        <div className="request-dates">
          <span>📅 {displayDate ? formatDate(displayDate) : 'Date not specified'}</span>
          <span>{formatCredit(request.credit, request.leaveRenderType)}</span>
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
        {request.credit && (
          <div className="request-comments">
            <small>Credit: {request.credit} day(s)</small>
          </div>
        )}
        {request.hrStatus === 'NOTED' && (
          <div className="hr-note">
            ✅ Noted by HR
          </div>
        )}
      </div>
      
      {/* Cancel button - only show if onCancel prop is provided (which only happens for PENDING requests) */}
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