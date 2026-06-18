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

  const pendingRequests = requests.filter(r => r.regularStatus === 'PENDING');
  const notedRequests = requests.filter(r => r.regularStatus === 'NOTED');
  const approvedRequests = requests.filter(r => r.hrStatus === 'APPROVED');
  const rejectedRequests = requests.filter(r => r.regularStatus === 'REJECTED');
  const canceledRequests = requests.filter(r => r.regularStatus === 'CANCELED');

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card approved">
          <h3>{approvedRequests.length}</h3>
          <p>HR Approved</p>
        </div>        
        <div className="stat-card noted">
          <h3>{notedRequests.length}</h3>
          <p>Approver Noted</p>
        </div>        
        <div className="stat-card pending">
          <h3>{pendingRequests.length}</h3>
          <p>Pending Requests</p>
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
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <button onClick={() => window.location.href = '/new-request'}>
          + New Leave Request
        </button>&nbsp;
        <button onClick={() => window.location.href = '/regularization'}>
          📝 Request Regularization
        </button>
      </div>
    </div>
  );
}

export default Dashboard;