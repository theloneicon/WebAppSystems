// src/pages/NewRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import LeaveForm from '../components/LeaveForm';

function NewRequest({ user }) {
  const navigate = useNavigate();
  const [hasPending, setHasPending] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkPendingRequests();
  }, [user.id]);

  const checkPendingRequests = async () => {
    const result = await api.getMyRequests(user.id);
    if (result.success) {
      const pending = result.requests.some(r => r.status === 'PENDING');
      setHasPending(pending);
    }
    setChecking(false);
  };

  const handleSubmit = async (formData) => {
    const result = await api.createRequest(
      user.id,
      formData.approverID,
      formData.startDate,
      formData.endDate,
      formData.totalDays,
      formData.reason,
      formData.leaveType
    );
    
    if (result.success) {
      alert(result.message);
      navigate('/my-requests');
    } else {
      alert(result.error);
    }
  };

  if (checking) return <div className="loading">Loading...</div>;

  if (hasPending) {
    return (
      <div className="new-request">
        <h1>New Leave Request</h1>
        <div className="alert alert-danger">
          <h3>⚠️ Cannot Create New Request</h3>
          <p>You have a pending request. Please wait for it to be processed or cancel it before creating a new one.</p>
          <button onClick={() => navigate('/my-requests')}>View My Requests</button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-request">
      <h1>New Leave Request</h1>
      <LeaveForm user={user} onSubmit={handleSubmit} />
    </div>
  );
}

export default NewRequest;