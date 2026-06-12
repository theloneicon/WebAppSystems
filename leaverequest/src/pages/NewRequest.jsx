// src/pages/NewRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import LeaveForm from '../components/LeaveForm';

function NewRequest({ user }) {
  const navigate = useNavigate();
  const [hasPending, setHasPending] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [checking, setChecking] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null); // ← Store form data

  useEffect(() => {
    checkPendingRequests();
  }, [user.id]);

  const checkPendingRequests = async () => {
    const result = await api.getMyRequests(user.id);
    if (result.success) {
      const pending = result.requests.filter(r => r.status === 'PENDING');
      setHasPending(pending.length > 0);
      setPendingRequests(pending);
    }
    setChecking(false);
  };

  const handleSubmit = async (formData) => {
    // If there's a pending request and not already showing warning
    if (hasPending && !showWarning) {
      setPendingFormData(formData);  // ← Save form data for later
      setShowWarning(true);
      return;
    }
    
    // Proceed with submission (use saved formData or passed formData)
    const dataToSubmit = pendingFormData || formData;
    
    const result = await api.createRequest(
      user.id,
      dataToSubmit.approverID,
      dataToSubmit.startDate,
      dataToSubmit.endDate,
      dataToSubmit.totalDays,
      dataToSubmit.reason,
      dataToSubmit.leaveType
    );
    
    if (result.success) {
      alert(result.message);
      navigate('/my-requests');
    } else {
      alert(result.error);
    }
    
    // Reset states
    setShowWarning(false);
    setPendingFormData(null);
  };

  const cancelSubmit = () => {
    setShowWarning(false);
    setPendingFormData(null);
  };

  if (checking) return <div className="loading">Loading...</div>;

  return (
    <div className="new-request">
      <h1>New Leave Request</h1>
      
      {/* Warning Banner - Always visible if there are pending requests */}
      {hasPending && !showWarning && (
        <div className="alert alert-warning">
          <h3>⚠️ Pending Request Reminder</h3>
          <p>You have {pendingRequests.length} pending request(s):</p>
          <ul>
            {pendingRequests.map(req => (
              <li key={req.id}>
                {req.startDate} to {req.endDate} - {req.reason}
              </li>
            ))}
          </ul>
          <p>You can still submit a new request, but please ensure the dates don't overlap.</p>
        </div>
      )}
      
      {/* Confirmation Dialog for submitting with pending requests */}
      {showWarning && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Confirm Submission</h3>
            <p>You have {pendingRequests.length} pending request(s).</p>
            <p>Are you sure you want to submit another request?</p>
            <div className="modal-actions">
              <button onClick={handleSubmit} className="confirm-btn">
                Yes, Submit Anyway
              </button>&nbsp;
              <button onClick={cancelSubmit} className="cancel-btn">
                No, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      
      <LeaveForm user={user} onSubmit={handleSubmit} />
    </div>
  );
}

export default NewRequest;