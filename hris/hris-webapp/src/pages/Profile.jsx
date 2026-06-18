// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Profile({ user }) {
  const [loading, setLoading] = useState(true);
  const [regularApproverName, setRegularApproverName] = useState('');
  const [alternateApproverName, setAlternateApproverName] = useState('');
  const [finalApproverName, setFinalApproverName] = useState('');

  useEffect(() => {
    fetchApproverNames();
  }, [user.regAprv, user.regAprvAlt, user.finalAprv]);

  const fetchApproverNames = async () => {
    setLoading(true);

    try {
      // Fetch Regular Approver Name
      if (user.regAprv && user.regAprv !== 0) {
        const result = await api.getEmployeeByRoleId(user.regAprv);
        if (result.success) {
          setRegularApproverName(result.employee.name);
        } else {
          setRegularApproverName(`Role ${user.regAprv} (Not found)`);
        }
      } else {
        setRegularApproverName('Not assigned');
      }

      // Fetch Alternate Approver Name
      if (user.regAprvAlt && user.regAprvAlt !== 0) {
        const result = await api.getEmployeeByRoleId(user.regAprvAlt);
        if (result.success) {
          setAlternateApproverName(result.employee.name);
        } else {
          setAlternateApproverName(`Role ${user.regAprvAlt} (Not found)`);
        }
      } else {
        setAlternateApproverName('None');
      }

      // Fetch Final Approver Name
      if (user.finalAprv && user.finalAprv !== 0) {
        const result = await api.getEmployeeByRoleId(user.finalAprv);
        if (result.success) {
          setFinalApproverName(result.employee.name);
        } else {
          setFinalApproverName(`Role ${user.finalAprv} (Not found)`);
        }
      } else {
        setFinalApproverName('None (Auto-approved)');
      }

    } catch (error) {
      console.error('Error fetching approvers:', error);
      setRegularApproverName('Error loading');
      setAlternateApproverName('Error loading');
      setFinalApproverName('Error loading');
    } finally {
      setLoading(false);
    }
  };

  // Get role category display
  const getRoleCategoryDisplay = () => {
    switch(user.roleCateg) {
      case 'Normal': return '👤 Normal User';
      case 'Approver05': return '👑 Regular Approver';
      case 'Approver07': return '⭐ Sr. Approver';
      case 'Approver08': return '⭐ Sr. Approver';
      case 'Approver09': return '🌟 CEO Approver';
      default: return user.roleCateg || 'Not specified';
    }
  };

  // Get role category description
  const getRoleCategoryDescription = () => {
    switch(user.roleCateg) {
      case 'Normal': return 'Cannot approve any requests';
      case 'Approver05': return 'Can approve as Regular Approver only';
      case 'Approver07': return 'Can approve as Regular Approver only';
      case 'Approver08': return 'Can approve as Regular and Final Approver';
      case 'Approver09': return 'Can approve as Final Approver (Skip approval)';
      default: return '';
    }
  };

  // Determine if using alternate approver
  const isUsingAlternate = user.altRegAprvFlag === 1 && user.regAprvAlt && user.regAprvAlt !== 0;

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
            <label>Role ID:</label>
            <span>{user.roleId}</span>
          </div>
          <div className="detail-row">
            <label>Role Category:</label>
            <span>
              {getRoleCategoryDisplay()}
              <br />
              <small className="role-description">{getRoleCategoryDescription()}</small>
            </span>
          </div>
          <div className="detail-row">
            <label>Regular Approver:</label>
            <span>
              {loading ? 'Loading...' : (
                <>
                  {regularApproverName}
                  {isUsingAlternate && (
                    <span className="info-badge"> (Alternate being used)</span>
                  )}
                </>
              )}
            </span>
          </div>
          <div className="detail-row">
            <label>Alternate Approver:</label>
            <span>{loading ? 'Loading...' : alternateApproverName}</span>
          </div>
          <div className="detail-row">
            <label>Final Approver:</label>
            <span>{loading ? 'Loading...' : finalApproverName}</span>
          </div>
          <div className="detail-row">
            <label>Allowed Regularization:</label>
            <span>
              {user.allowedRegzn === 1 ? '✅ Yes' : '❌ No'}
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