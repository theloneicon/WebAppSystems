// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Dashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');
  const canceledRequests = requests.filter(r => r.status === 'CANCELED');

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card pending">
          <h3>{pendingRequests.length}</h3>
          <p>Pending Requests</p>
        </div>
        <div className="stat-card approved">
          <h3>{approvedRequests.length}</h3>
          <p>Approved</p>
        </div>
        <div className="stat-card rejected">
          <h3>{rejectedRequests.length}</h3>
          <p>Rejected</p>
        </div>
        <div className="stat-card canceled">
          <h3>{canceledRequests.length}</h3>
          <p>Canceled</p>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="pending-section">
          <h2>⚠️ Pending Requests</h2>
          <div className="alert alert-warning">
            You have {pendingRequests.length} pending request(s). 
            You cannot submit new requests until they are approved, rejected, or canceled.
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <button 
          onClick={() => window.location.href = '/new-request'}
          disabled={pendingRequests.length > 0}
        >
          {pendingRequests.length > 0 ? 'Complete Pending First' : '+ New Leave Request'}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;