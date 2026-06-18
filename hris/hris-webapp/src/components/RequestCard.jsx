// src/components/RequestCard.jsx
function RequestCard({ request, onCancel }) {
  const getStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get display status
  const getDisplayStatus = () => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || 'PENDING';
  };

  // Check if Final Approver has acted
  const hasFinalApproverActed = () => {
    return request.hrStatus === 'APPROVED' || request.hrStatus === 'REJECTED';
  };

  // Get final approver display name
  const getFinalApproverName = () => {
    if (request.hrNameNotedBy) return request.hrNameNotedBy;
    if (request.finalApproverName) return request.finalApproverName;
    if (request.hrIdNotedBy) return `User ${request.hrIdNotedBy}`;
    return 'Pending';
  };

  // Get final approver action status
  const getFinalApproverStatus = () => {
    if (request.hrStatus === 'APPROVED') return '✅ Approved';
    if (request.hrStatus === 'REJECTED') return '❌ Rejected';
    if (request.regularStatus === 'NOTED') return '⏳ Pending';
    return 'N/A';
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
      
      {/* Date Range */}
        <div className="request-dates">
          <span>📅 {request.dateRange || request.date || 'Date not specified'}</span>
          <span>{request.totalDays || request.dates?.length || 1} day(s)</span>
        </div>

        <div className="request-body">
        {/* Leave Type */}
        <div className="request-leavetype">
          <strong>Leave Type:</strong> {request.leaveType || request.VLTtype || 'Not specified'}
        </div>
        
        {/* Reason */}
        <div className="request-reason">
          <strong>Reason:</strong> {request.reason}
        </div>
        
        
        {/* Regular Approver */}
        <div className="request-approver">
          <strong>Regular Approver:</strong> {request.approverName}
          {request.regularStatus === 'NOTED' && (
            <span className="status-badge-small noted">✅ Noted</span>
          )}
          {request.regularStatus === 'REJECT' && (
            <span className="status-badge-small rejected">❌ Rejected</span>
          )}
        </div>
        
        {/* Final Approver - Show when Regular_Status is NOTED */}
        {request.regularStatus === 'NOTED' && (
          <div className="request-final-approver">
            <strong>Final Approver:</strong> {getFinalApproverName()}
            <span className={`status-badge-small ${request.hrStatus === 'APPROVED' ? 'approved' : request.hrStatus === 'REJECTED' ? 'rejected' : 'pending'}`}>
              {getFinalApproverStatus()}
            </span>
            {hasFinalApproverActed() && request.hrActionDT && (
              <span className="final-action-date">
                <small>on {formatDateTime(request.hrActionDT)}</small>
              </span>
            )}
          </div>
        )}
        
        {/* HR Status (for admin view) */}
        {request.hrStatus && request.hrStatus !== 'PENDING' && request.hrStatus !== 'NOTED' && (
          <div className="request-hr-status">
            <strong>HR Status:</strong> {request.hrStatus}
            {request.hrNameNotedBy && (
              <span className="hr-noted-by"> by {request.hrNameNotedBy}</span>
            )}
          </div>
        )}
        
        {/* Submitted and Expires */}
        <div className="request-created">
          <small>Submitted: {formatDate(request.createdAt)}</small>
          {request.expiresAt && new Date(request.expiresAt) > new Date() && (
            <small> Expires: {formatDate(request.expiresAt)}</small>
          )}
        </div>
        
        {/* Comments */}
        {request.comment && (
          <div className="request-comments">
            <strong>Comment:</strong> {request.comment}
          </div>
        )}
      </div>
      
      {/* Cancel/Recall Button */}
      {onCancel && (
        <div className="request-actions">
          <button onClick={() => onCancel(request.id)} className="cancel-btn">
            {request.regularStatus === 'PENDING' ? '❌ Cancel Request' : 
             request.regularStatus === 'NOTED' && request.hrStatus !== 'APPROVED' ? '🔙 Recall Request' : 
             'Cancel Request'}
          </button>
        </div>
      )}
    </div>
  );
}

export default RequestCard;