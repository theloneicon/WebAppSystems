// src/components/LeaveForm.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { leaveTypes } from '../utils/vars';

function LeaveForm({ user, onSubmit }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveRenderType, setLeaveRenderType] = useState('FULL');
  const [credit, setCredit] = useState(1);
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [approverID, setApproverID] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovers();
  }, [user.aprvLevel, user.deptID, user.aprvRegAprv]);

  const loadApprovers = async () => {
    const result = await api.getApprovers(user.aprvLevel, user.deptID, user.aprvRegAprv);
    if (result.success) {
      setApprovers(result.approvers);
      if (result.approvers.length > 0) {
        setApproverID(result.approvers[0].id);
      }
    }
    setLoading(false);
  };

  // Update credit when leaveRenderType changes
  useEffect(() => {
    if (leaveRenderType === 'FULL') {
      setCredit(1);
    } else {
      setCredit(0.5);
    }
  }, [leaveRenderType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      approverID,
      date: selectedDate,
      leaveRenderType,
      credit,
      leaveType,
      reason
    });
  };

  const renderTypeOptions = [
    { value: 'FULL', label: 'Full Day (1.0 day)' },
    { value: '1ST_HALF', label: '1st Half - AM (0.5 day)' },
    { value: '2ND_HALF', label: '2nd Half - PM (0.5 day)' }
  ];

  if (loading) return <div className="loading">Loading approvers...</div>;

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Select Approver *</label>
        <select value={approverID} onChange={(e) => setApproverID(e.target.value)} required>
          {approvers.map(approver => (
            <option key={approver.id} value={approver.id}>
              {approver.name} ({approver.position}) - Level {approver.aprvLevel}
            </option>
          ))}
        </select>
        <small>Based on your approval level: {user.aprvRegAprv}</small>
      </div>

      <div className="form-group">
        <label>Leave Date *</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          required
          min={new Date().toISOString().split('T')[0]}
        />
        <small>Select the specific date for this leave request</small>
      </div>

      <div className="form-group">
        <label>Leave Type *</label>
        <select 
          required 
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
        >
          <option disabled value="">Select leave type</option>
          {leaveTypes.map((leave) => (
            <option key={leave.id} value={leave.value}>
              {leave.value}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Leave Duration *</label>
        <div className="radio-group">
          {renderTypeOptions.map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="leaveRenderType"
                value={option.value}
                checked={leaveRenderType === option.value}
                onChange={(e) => setLeaveRenderType(e.target.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Credit Days</label>
        <input
          type="text"
          value={`${credit} day${credit !== 1 ? 's' : ''}`}
          disabled
          className="credit-display"
        />
        <small>Automatically calculated based on duration selected</small>
      </div>

      <div className="form-group">
        <label>Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          placeholder="Please provide reason for leave..."
        />
      </div>

      <button type="submit">Submit Leave Request</button>
    </form>
  );
}

export default LeaveForm;