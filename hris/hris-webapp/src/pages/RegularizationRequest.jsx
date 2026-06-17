// src/pages/RegularizationRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function RegularizationRequest({ user }) {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('08:00 AM');
  const [clockOut, setClockOut] = useState('05:00 PM');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [totalHours, setTotalHours] = useState(8);
  const [reason, setReason] = useState('');
  const [obReference, setObReference] = useState('');
  const [approverID, setApproverID] = useState('');
  const [finalApprover, setFinalApprover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [existingRegularizations, setExistingRegularizations] = useState([]);

  useEffect(() => {
    loadFinalApprover();
    loadExistingRegularizations();
  }, [user.id]);

  useEffect(() => {
    calculateTotalHours();
  }, [clockIn, clockOut, breakMinutes]);

  const loadFinalApprover = async () => {
    // Since the user object already has finalAprvName and finalAprv (Role ID)
    // We need to get the actual employee ID from the Role ID
    const result = await api.getEmployeeByRoleId(user.finalAprv);
    if (result.success) {
      setFinalApprover(result.employee);
      setApproverID(result.employee.id);
    } else {
      // Fallback: use the user's finalAprvName if available
      if (user.finalAprvName) {
        setFinalApprover({
          id: user.finalAprv,
          name: user.finalAprvName,
          position: 'Final Approver'
        });
        setApproverID(user.finalAprv);
      }
    }
    setLoadingApprovers(false);
  };

  const loadExistingRegularizations = async () => {
    const result = await api.getMyRegularizations(user.id);
    if (result.success) {
      setExistingRegularizations(result.requests);
    }
  };

  const calculateTotalHours = () => {
    const start = parseTimeToHours(clockIn);
    const end = parseTimeToHours(clockOut);
    const breakHours = breakMinutes / 60;
    const hours = Math.max(0, end - start - breakHours);
    setTotalHours(parseFloat(hours.toFixed(2)));
  };

  const parseTimeToHours = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours + minutes / 60;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    if (!reason) {
      alert('Please provide a reason');
      return;
    }
    
    setLoading(true);
    
    const result = await api.createRegularizationRequest(
      user.id,
      user.name,
      date,
      clockIn,
      clockOut,
      breakMinutes,
      totalHours,
      reason,
      obReference,
      approverID  // This is now the Final Approver ID
    );
    
    if (result.success) {
      alert('✅ Regularization request submitted for final approval!');
      navigate('/my-requests');
    } else {
      alert('❌ Error: ' + result.error);
    }
    
    setLoading(false);
  };

  // Generate time options for dropdown
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hour12 = h % 12 || 12;
      const period = h < 12 ? 'AM' : 'PM';
      const minuteStr = m.toString().padStart(2, '0');
      timeOptions.push(`${hour12}:${minuteStr} ${period}`);
    }
  }

  if (loadingApprovers) return <div className="loading">Loading...</div>;

  return (
    <div className="regularization-page">
      <h1>📝 Attendance Regularization</h1>
      <p>Request approval for missed or incorrect attendance records</p>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="regularization-form">
          {/* Final Approver Information (Read-only) */}
          <div className="approver-info">
            <div className="info-card">
              <h4>📋 Approval Routing</h4>
              <div className="info-row">
                <span className="info-label">Final Approver:</span>
                <span className="info-value">
                  {finalApprover?.name || user.finalAprvName || 'Not assigned'}
                </span>
                <span className="info-badge">(Final Approval Required)</span>
              </div>
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
              <label>Clock In Time *</label>
              <select value={clockIn} onChange={(e) => setClockIn(e.target.value)} required>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Clock Out Time *</label>
              <select value={clockOut} onChange={(e) => setClockOut(e.target.value)} required>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Break</label>
              <input 
                type="text" 
                value="60 minutes (Standard lunch)" 
                disabled 
                className="credit-display"
              />
              <input type="hidden" value={60} />
              <small>Break time is fixed at 60 minutes</small>
            </div>

            <div className="form-group">
              <label>Total Hours Rendered</label>
              <input type="text" value={`${totalHours} hours`} disabled />
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Regularization *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="e.g., Forgot to clock in, Official Business, System error, etc."
            />
          </div>

          <div className="form-group">
            <label>OB Reference (if applicable)</label>
            <input
              type="text"
              value={obReference}
              onChange={(e) => setObReference(e.target.value)}
              placeholder="e.g., OB-2026-001"
            />
            <small>If this was for Official Business, please provide reference</small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Regularization Request'}
          </button>
        </form>
      </div>

      {/* Previous Regularizations */}
      {existingRegularizations.length > 0 && (
        <div className="existing-requests">
          <h3>Your Previous Regularization Requests</h3>
          <div className="requests-list">
            {existingRegularizations.map(req => (
              <div key={req.id} className={`request-card ${req.approval_status?.toLowerCase()}`}>
                <div className="request-header">
                  <span className="request-id">{req.id}</span>
                  <span className={`status-badge ${req.approval_status?.toLowerCase()}`}>
                    {req.approval_status || 'PENDING'}
                  </span>
                </div>
                <div className="request-body">
                  <div><strong>Date:</strong> {req.date}</div>
                  <div><strong>Hours:</strong> {req.clockIn} - {req.clockOut}</div>
                  <div><strong>Break:</strong> {req.breakMinutes} minutes</div>
                  <div><strong>Total:</strong> {req.totalHours} hours</div>
                  <div><strong>Reason:</strong> {req.reason}</div>
                  {req.hr_status === 'NOTED' && (
                    <div className="hr-note">✅ Noted by HR</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RegularizationRequest;