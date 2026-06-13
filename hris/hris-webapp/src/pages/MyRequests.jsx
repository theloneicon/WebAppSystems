// src/pages/MyRequests.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import RequestCard from '../components/RequestCard';

function MyRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    const result = await api.getMyRequests(user.id);
    if (result.success) {
      setRequests(result.requests);
    }
    setLoading(false);
  };

  const handleCancel = async (requestID) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      const result = await api.cancelRequest(requestID, user.id);
      if (result.success) {
        await loadRequests();
        alert(result.message);
      } else {
        alert(result.error);
      }
    }
  };

  // Format credit display
  const formatCredit = (credit) => {
    if (credit === 1) return 'Full Day';
    if (credit === 0.5) return 'Half Day';
    return `${credit} day(s)`;
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="my-requests">
      <h1>My Leave Requests</h1>
      
      <div className="filter-bar">
        <button onClick={() => setFilter('ALL')} className={filter === 'ALL' ? 'active' : ''}>
          All ({requests.length})
        </button>
        <button onClick={() => setFilter('PENDING')} className={filter === 'PENDING' ? 'active' : ''}>
          Pending ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button onClick={() => setFilter('APPROVED')} className={filter === 'APPROVED' ? 'active' : ''}>
          Approved ({requests.filter(r => r.status === 'APPROVED').length})
        </button>
        <button onClick={() => setFilter('REJECTED')} className={filter === 'REJECTED' ? 'active' : ''}>
          Rejected ({requests.filter(r => r.status === 'REJECTED').length})
        </button>
        <button onClick={() => setFilter('CANCELED')} className={filter === 'CANCELED' ? 'active' : ''}>
          Canceled ({requests.filter(r => r.status === 'CANCELED').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found.</p>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={{
                ...request,
                // Map fields for RequestCard compatibility
                leaveRenderType: request.leaveRenderType,
                credit: request.credit,
                date: request.date,
                leaveType: request.leaveType
              }}
              onCancel={request.status === 'PENDING' ? handleCancel : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyRequests;