// src/components/LeaveForm.jsx
import { useState, useEffect } from 'react';
import { leaveTypes } from '../utils/vars';

// Helper function to check if a date is a weekend
const isWeekend = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

// Helper function to get the next working day
const getNextWorkingDay = (dateString) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  while (isWeekend(date.toISOString().split('T')[0])) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

// Helper function to check if range includes weekends
const hasWeekendInRange = (from, to) => {
  if (!from || !to) return false;
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (isWeekend(dateStr)) {
      return true;
    }
    current.setDate(current.getDate() + 1);
  }
  return false;
};

// Helper function to count working days only
const countWorkingDays = (from, to) => {
  if (!from || !to) return 0;
  let count = 0;
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (!isWeekend(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

function LeaveForm({ user, onSubmit }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [weekendWarning, setWeekendWarning] = useState('');
  const [fromDateError, setFromDateError] = useState('');
  const [toDateError, setToDateError] = useState('');

  useEffect(() => {
    calculateTotalDays();
  }, [fromDate, toDate]);

  const calculateTotalDays = () => {
    if (fromDate && toDate) {
      // Count only working days (Mon-Fri)
      const workingDays = countWorkingDays(fromDate, toDate);
      setTotalDays(workingDays);
      
      // Check if range includes weekends
      if (hasWeekendInRange(fromDate, toDate)) {
        setWeekendWarning('⚠️ Weekends are automatically excluded. Only working days (Mon-Fri) are counted.');
      } else {
        setWeekendWarning('');
      }
    } else {
      setTotalDays(0);
      setWeekendWarning('');
    }
  };

  const handleFromDateChange = (e) => {
    const value = e.target.value;
    
    if (isWeekend(value)) {
      const nextWorkingDay = getNextWorkingDay(value);
      setFromDateError(`❌ Weekends are not selectable. Next working day: ${nextWorkingDay}`);
      setFromDate('');
      return;
    }
    
    setFromDateError('');
    setFromDate(value);
    
    // If To Date is before From Date, clear it
    if (toDate && new Date(toDate) < new Date(value)) {
      setToDate('');
    }
  };

  const handleToDateChange = (e) => {
    const value = e.target.value;
    
    if (isWeekend(value)) {
      const nextWorkingDay = getNextWorkingDay(value);
      setToDateError(`❌ Weekends are not selectable. Next working day: ${nextWorkingDay}`);
      setToDate('');
      return;
    }
    
    setToDateError('');
    setToDate(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (!fromDate || !toDate) {
      alert('Please select both From and To dates');
      return;
    }
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      alert('From date cannot be after To date');
      return;
    }
    
    if (totalDays === 0) {
      alert('No working days selected. Please select valid dates.');
      return;
    }
    
    setSubmitting(true);
    await onSubmit({
      fromDate: fromDate,
      toDate: toDate,
      totalDays,
      leaveType,
      reason
    });
    setSubmitting(false);
  };

  // Determine which regular approver is being used
  const isUsingAlternate = user.altRegAprvFlag === 1 && user.regAprvAlt;
  const regularApproverName = isUsingAlternate ? user.regAprvAltName : user.regAprvName;
  const regularApproverLabel = isUsingAlternate ? 'Alternate Regular Approver' : 'Regular Approver';

  // Get role display name
  const getRoleDisplay = () => {
    switch(user.roleCateg) {
      case 'Normal': return '👤 Normal User';
      case 'Approver05': return '👑 Regular Approver';
      case 'Approver07': return '⭐ Sr. Approver';
      case 'Approver08': return '⭐ Sr. Approver';
      case 'Approver09': return '🌟 CEO Approver';
      default: return user.roleCateg || 'Unknown';
    }
  };

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      {/* Approver Information (Read-only) */}
      <div className="approver-info">
        <div className="info-card">
          <h4>📋 Approval Routing</h4>
          <div className="info-row">
            <span className="info-label">Your Role : </span>
            <span className="info-value">{getRoleDisplay()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Regular Approver : </span>
            <span className="info-value">{regularApproverName || 'Not assigned'}</span>
            {isUsingAlternate && (
              <span className="info-badge">(Alternate - Regular Approver on Leave)</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Final Approver :</span>
            <span className="info-value">
              {user.finalAprvName ? (
                user.finalAprv === user.regAprv ? 
                  `${user.finalAprvName} (Same as Regular - Auto-approved after NOTED)` : 
                  user.finalAprvName
              ) : 'None (Auto-approved after NOTED)'}
            </span>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>From Date *</label>
          <input
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          {fromDateError && <small className="error-text">{fromDateError}</small>}
          <small>Select start date (Weekdays only)</small>
        </div>

        <div className="form-group">
          <label>To Date *</label>
          <input
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            required
            min={fromDate || new Date().toISOString().split('T')[0]}
          />
          {toDateError && <small className="error-text">{toDateError}</small>}
          <small>Select end date (Weekdays only)</small>
        </div>
      </div>

      {weekendWarning && (
        <div className="alert alert-warning">
          {weekendWarning}
        </div>
      )}

      <div className="form-group">
        <label>Total Working Days</label>
        <input
          type="text"
          value={`${totalDays} working day${totalDays !== 1 ? 's' : ''}`}
          disabled
          className="credit-display"
        />
        <small>Only working days (Mon-Fri) are counted</small>
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
        <label>Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          placeholder="Please provide reason for leave..."
        />
      </div>

      <button type="submit" disabled={submitting || totalDays === 0}>
        {submitting ? 'Submitting...' : `Submit Leave Request (${totalDays} working day${totalDays !== 1 ? 's' : ''})`}
      </button>
    </form>
  );
}

export default LeaveForm;