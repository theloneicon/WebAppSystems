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

  // Get display status for filtering
  const getDisplayStatus = (request) => {
    if (request.hrStatus === 'APPROVED') return 'APPROVED';
    if (request.hrStatus === 'REJECTED') return 'REJECTED';
    return request.regularStatus || 'PENDING';
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'ALL') return true;
    return getDisplayStatus(req) === filter;
  });

  const getCount = (status) => {
    return requests.filter(req => getDisplayStatus(req) === status).length;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="my-requests">
      <h1>My Leave Requests</h1>
      
      <div className="filter-bar">
        <button onClick={() => setFilter('ALL')} className={filter === 'ALL' ? 'active' : ''}>
          All ({requests.length})
        </button>
        <button onClick={() => setFilter('APPROVED')} className={filter === 'APPROVED' ? 'active' : ''}>
          Approved ({getCount('APPROVED')})
        </button>
        <button onClick={() => setFilter('NOTED')} className={filter === 'NOTED' ? 'active' : ''}>
          Noted ({getCount('NOTED')})
        </button>
        <button onClick={() => setFilter('PENDING')} className={filter === 'PENDING' ? 'active' : ''}>
          Pending ({getCount('PENDING')})
        </button>
        <button onClick={() => setFilter('REJECT')} className={filter === 'REJECT' ? 'active' : ''}>
          Rejected ({getCount('REJECT')})
        </button>
        <button onClick={() => setFilter('CANCEL')} className={filter === 'CANCEL' ? 'active' : ''}>
          Canceled ({getCount('CANCEL')})
        </button>
        <button onClick={() => setFilter('RECALL')} className={filter === 'RECALL' ? 'active' : ''}>
          Recalled ({getCount('RECALL')})
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
              request={request}
              onCancel={request.regularStatus === 'PENDING' ? handleCancel : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyRequests;