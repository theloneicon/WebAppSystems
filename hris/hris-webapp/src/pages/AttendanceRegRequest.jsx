// src/pages/AttendanceRegRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { attendanceRegReason } from '../utils/vars';

function AttendanceRegRequest({ user }) {
  const navigate = useNavigate();
  
  // Form fields
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('08:00 AM');
  const [clockOut, setClockOut] = useState('05:00 PM');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [obReference, setObReference] = useState('');
  const [requestorComments, setRequestorComments] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [existingRegularizations, setExistingRegularizations] = useState([]);
  const [approver, setApprover] = useState(null);
  
  // ⭐ Edit mode
  const [editingRequest, setEditingRequest] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadApprover();
    loadExistingRegularizations();
  }, [user.id]);

  // ⭐ Load approver from AttendanceReg_AprvRoleID
  const loadApprover = async () => {
    setLoadingApprovers(true);
    try {
      // Get the approver role ID from user's profile
      const approverRoleID = user.attendanceReg_AprvRoleID;
      
      if (approverRoleID && approverRoleID !== 0) {
        const result = await api.getEmployeeByRoleId(approverRoleID);
        if (result.success) {
          setApprover(result.employee);
          console.log('✅ Approver loaded:', result.employee.name);
        } else {
          console.log('⚠️ Approver not found for Role ID:', approverRoleID);
          // Try fallback to final approver
          if (user.finalAprvName) {
            setApprover({
              id: user.finalAprv,
              name: user.finalAprvName,
              position: 'Approver'
            });
          }
        }
      } else {
        console.log('⚠️ No AttendanceReg_AprvRoleID configured');
      }
    } catch (error) {
      console.error('Error loading approver:', error);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const loadExistingRegularizations = async () => {
    const result = await api.getMyRegularizations(user.id);
    if (result.success) {
      setExistingRegularizations(result.requests);
    }
  };

  // ⭐ Handle editing an existing request
  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setIsEditMode(true);
    setDate(request.date);
    setClockIn(request.clockIn || '08:00 AM');
    setClockOut(request.clockOut || '05:00 PM');
    setReason(request.reason || '');
    setRequestorComments(request.comments || '');
    setObReference(request.reference || '');
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setIsEditMode(false);
    setDate('');
    setClockIn('08:00 AM');
    setClockOut('05:00 PM');
    setReason('');
    setRequestorComments('');
    setObReference('');
  };

  // ⭐ Handle cancel request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      const result = await api.cancelRegularizationRequest(requestId, user.id);
      if (result.success) {
        alert('✅ Request cancelled successfully');
        loadExistingRegularizations();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('❌ Error cancelling request');
    }
  };

  // ⭐ Handle submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    if (!reason) {
      alert('Please select a reason');
      return;
    }
    
    // Validate reason
    const selectedReason = attendanceRegReason.find(r => r.value === reason);
    if (!selectedReason) {
      alert('Please select a valid reason');
      return;
    }
    
    // If reason is 'Others', require additional details
    if (selectedReason.code === 'OTHERS' && !otherReason.trim()) {
      alert('Please specify the reason for "Others"');
      return;
    }
    
    // Validate that there's at least one time provided for non-OB reasons
    const isOB = selectedReason.code === 'OB';
    if (!isOB) {
      if (!clockIn && !clockOut) {
        alert('Please provide at least Clock In or Clock Out time');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      let result;
      const finalReason = selectedReason.code === 'OTHERS' ? otherReason : reason;
      
      if (isEditMode && editingRequest) {
        // ⭐ UPDATE existing request
        result = await api.updateRegularizationRequest(
          editingRequest.id,
          user.id,
          date,
          clockIn || '',
          clockOut || '',
          finalReason,
          requestorComments
        );
      } else {
        // ⭐ CREATE new request
        result = await api.createRegularizationRequest(
          user.id,
          user.name,
          date,
          clockIn || '',
          clockOut || '',
          finalReason,
          obReference,
          approver?.id || ''
        );
      }
      
      if (result.success) {
        alert(isEditMode ? '✅ Request updated successfully!' : '✅ Regularization request submitted!');
        setIsEditMode(false);
        setEditingRequest(null);
        setDate('');
        setClockIn('08:00 AM');
        setClockOut('05:00 PM');
        setReason('');
        setOtherReason('');
        setRequestorComments('');
        setObReference('');
        loadExistingRegularizations();
        if (!isEditMode) {
          navigate('/my-requests');
        }
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Generate time options
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hour12 = h % 12 || 12;
      const period = h < 12 ? 'AM' : 'PM';
      const minuteStr = m.toString().padStart(2, '0');
      timeOptions.push(`${hour12}:${minuteStr} ${period}`);
    }
  }

  // ⭐ Get status badge class
  const getStatusClass = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'FOR_REVIEW': return 'status-for-review';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELED': return 'status-canceled';
      case 'EXPIRED': return 'status-expired';
      default: return '';
    }
  };

  // ⭐ Get status label
  const getStatusLabel = (status) => {
    switch(status) {
      case 'PENDING': return '⏳ PENDING';
      case 'FOR_REVIEW': return '🔄 FOR REVIEW';
      case 'APPROVED': return '✅ APPROVED';
      case 'REJECTED': return '❌ REJECTED';
      case 'CANCELED': return '🚫 CANCELED';
      case 'EXPIRED': return '⏰ EXPIRED';
      default: return status || 'PENDING';
    }
  };

  if (loadingApprovers) return <div className="loading">Loading...</div>;

  return (
    <div className="regularization-page">
      <h2>📝 Attendance Regularization</h2>
      <p>Request approval for missed or incorrect attendance records</p>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="regularization-form">
          {/* ⭐ Approver Information (Read-only) */}
          <div className="approver-info">
            <div className="info-card">
              <h4>📋 Approval Routing</h4>
              <div className="info-row">
                <span className="info-label">Approver:</span>
                <span className="info-value">
                  {approver?.name || 'Not assigned'}
                </span>
                <span className="info-badge">(Approval Required)</span>
              </div>
              {isEditMode && (
                <div className="info-row" style={{ color: '#eab308', marginTop: '4px' }}>
                  <span className="info-label">✏️ Editing:</span>
                  <span className="info-value">{editingRequest?.id}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Date to Regularize *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
            <small>Only dates in the past can be regularized</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Clock In Time</label>
              <select 
                value={clockIn} 
                onChange={(e) => setClockIn(e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <small>Leave as is if not applicable</small>
            </div>

            <div className="form-group">
              <label>Clock Out Time</label>
              <select 
                value={clockOut} 
                onChange={(e) => setClockOut(e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <small>Leave as is if not applicable</small>
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Regularization *</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              required
            >
              <option disabled value="">Select a reason</option>
              {attendanceRegReason.map((item) => (
                <option key={item.id} value={item.value}>
                  {item.icon} {item.value}
                </option>
              ))}
            </select>
          </div>

          {/* ⭐ Show additional input for 'Others' */}
          {reason && attendanceRegReason.find(r => r.value === reason)?.code === 'OTHERS' && (
            <div className="form-group">
              <label>Please specify:</label>
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Enter specific reason..."
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Requestor Comments</label>
            <textarea
              value={requestorComments}
              onChange={(e) => setRequestorComments(e.target.value)}
              rows={3}
              placeholder="Additional details about your request..."
            />
          </div>

          {!isEditMode && (
            <div className="form-group">
              <label>OB Reference (if applicable)</label>
              <input
                type="text"
                value={obReference}
                onChange={(e) => setObReference(e.target.value)}
                placeholder="e.g., OB-2026-001"
              />
              <small>If this is for Official Business, please provide reference</small>
            </div>
          )}

          <div className="form-actions">
            {isEditMode ? (
              <>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? '⏳ Updating...' : '📝 Update Request'}
                </button>
                <button type="button" onClick={cancelEdit} className="cancel-btn">
                  ❌ Cancel Edit
                </button>
              </>
            ) : (
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? '⏳ Submitting...' : '📤 Submit Regularization Request'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ⭐ Previous Regularizations */}
      {existingRegularizations.length > 0 && (
        <div className="existing-requests">
          <h3>Your Regularization Requests</h3>
          <div className="requests-list">
            {existingRegularizations.map(req => {
              const isPending = req.status === 'PENDING' || req.status === 'FOR_REVIEW';
              const canEdit = (req.status === 'PENDING') && new Date(req.expiredAt) > new Date();
              const canCancel = req.status === 'PENDING';
              
              return (
                <div key={req.id} className={`request-card ${getStatusClass(req.status)}`}>
                  <div className="request-header">
                    <span className="request-id">{req.id}</span>
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  <div className="request-body">
                    <div><strong>Date:</strong> {req.date}</div>
                    <div><strong>Time:</strong> {req.clockIn || 'N/A'} - {req.clockOut || 'N/A'}</div>
                    <div><strong>Reason:</strong> {req.reason}</div>
                    {req.comments && <div><strong>Comments:</strong> {req.comments}</div>}
                    <div><strong>Approver:</strong> {req.approverName || 'Pending'}</div>
                    {req.expiredAt && (
                      <div><strong>Expires:</strong> {new Date(req.expiredAt).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="request-actions">
                    {canEdit && (
                      <button 
                        onClick={() => handleEditRequest(req)} 
                        className="action-btn edit-btn"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {canCancel && (
                      <button 
                        onClick={() => handleCancelRequest(req.id)} 
                        className="action-btn cancel-btn"
                      >
                        ❌ Cancel
                      </button>
                    )}
                    {req.status === 'FOR_REVIEW' && (
                      <span className="review-note">🔄 Under review - extended by 7 days</span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="approve-note">✅ Approved - Attendance records updated</span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="reject-note">❌ Rejected - Please contact HR</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceRegRequest;