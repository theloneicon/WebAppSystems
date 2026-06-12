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
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`request-card ${getStatusColor(request.status)}`}>
      <div className="request-header">
        <span className="request-id">{request.id}</span>
        <span className={`status-badge ${request.status.toLowerCase()}`}>
          {request.status}
        </span>
      </div>
      
      <div className="request-body">
        <div className="request-dates">
          <span>📅 {formatDate(request.startDate)} → {formatDate(request.endDate)}</span>
          <span>{Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1} days</span>
        </div>
        <div className="request-leavetype">
          <strong>Leave Type:</strong> {request.leaveType}
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
        {request.totalDays && (
          <div className="request-comments">
           <small> Total Day(s): {request.totalDays}</small>
          </div>
        )}        
      </div>
      <br></br>
      {onCancel && (
        <div className="request-actions">
          <button onClick={() => onCancel(request.id)} className="cancel-btn">
            Cancel Request
          </button>
        </div>
      )}
    </div>
  );
}

export default RequestCard;