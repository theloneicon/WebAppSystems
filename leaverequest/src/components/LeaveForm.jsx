// src/components/LeaveForm.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function LeaveForm({ user, onSubmit }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [reason, setReason] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      approverID,
      startDate,
      endDate,
      totalDays,
      reason
    });
  };

  if (loading) return <div>Loading approvers...</div>;

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
        <label>Start Date *</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label>End Date *</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          min={startDate || new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label>Total Day(s) *</label>
        <input
          type="Text"
          value={totalDays}
          onChange={(e) => setTotalDays(e.target.value)}
          placeholder="Enter Total Days"
          required          
        />
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

      <button type="submit">Submit Request</button>
    </form>
  );
}

export default LeaveForm;