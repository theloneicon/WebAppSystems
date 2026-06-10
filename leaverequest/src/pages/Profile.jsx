// src/pages/Profile.jsx
function Profile({ user }) {
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
            <span>{user.aprvRegAprv} |</span>  
          </div>
          <div className="detail-row">
            <label>Access Level:</label>
            <span>
              {user.aprvLevel === 0 && '👤 Normal User'}
              {user.aprvLevel === 1 && '👑 Admin'}
              {user.aprvLevel === 2 && '⭐ Superuser'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;