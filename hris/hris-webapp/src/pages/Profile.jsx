// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Profile({ user }) {
  const [approverNames, setApproverNames] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApproverNames();
  }, [user.aprvRegAprv, user.deptID, user.aprvLevel]);

  const fetchApproverNames = async () => {
    if (!user.aprvRegAprv) {
      setApproverNames('No approvers configured');
      setLoading(false);
      return;
    }

    try {
      const result = await api.getApprovers(user.aprvLevel, user.deptID, user.aprvRegAprv);
      
      if (result.success && result.approvers.length > 0) {
        // Extract names from approvers array
        const names = result.approvers.map(approver => approver.name).join('; ');
        setApproverNames(names);
      } else {
        // Fallback to showing the raw levels if no approvers found
        setApproverNames(`${user.aprvRegAprv} (No matching users found)`);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      setApproverNames(user.aprvRegAprv || 'Error loading approvers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile">
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {user.initials}
          </div>
          <h2>{user.name}</h2>
          <p className="status-badge">{user.status}</p>
        </div>
        
        <div className="profile-details">
          <div className="detail-row">
            <label>Employee ID:</label>
            <span>{user.id}</span>
          </div>
          <div className="detail-row">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          <div className="detail-row">
            <label>Position:</label>
            <span>{user.position}</span>
          </div>
          <div className="detail-row">
            <label>Department:</label>
            <span>{user.deptName} (ID: {user.deptID})</span>
          </div>
          <div className="detail-row">
            <label>Approval Level:</label>
            <span>Level {user.aprvLevel}</span>
          </div>
          <div className="detail-row">
            <label>Regular Approvers:</label>
            <span>
              {loading ? (
                'Loading...'
              ) : (
                <>
                  {user.aprvRegAprv} → {approverNames}
                </>
              )}
            </span>
          </div>
          <div className="detail-row">
            <label>Access Level:</label>
            <span>
              {user.aprvLevel === 0 && '👤 Normal User'}
              {user.aprvLevel === 1 && '👑 Admin'}
              {user.aprvLevel === 2 && '⭐ Superuser'}
            </span>
          </div>
          <div className="detail-row">
            <label>Status:</label>
            <span className={user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}>
              {user.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;