// src/components/UserMain.jsx
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import AppRoutes from './AppRoutes';

function UserMain({ user, onLogout }) {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content">
          <AppRoutes user={user} />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default UserMain;