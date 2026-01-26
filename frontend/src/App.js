import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateUser from './components/CreateUser';
import ManageObjects from './components/ManageObjects';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Employees from './components/Employees';
import Schedules from './components/Schedules';
import ObjectSchedules from './components/ObjectSchedules';
import CreateSchedule from './components/CreateNewSchedule';
import ChangePassword from './components/ChangePassword'; // Pamiętaj o imporcie!
import SchedulePreferences from './components/SchedulePreferences';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // --- 1. FUNKCJA DEKODUJĄCA ROLĘ ---
  const getRoleFromToken = (jwtToken) => {
    try {
      if (!jwtToken) return null;
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload).sub?.role;
    } catch { return null; }
  };

  const role = getRoleFromToken(token);
  const isGlobalAdmin = role === 'admin' || role === 'global_hr';

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  };

  // --- GLÓWNA ZMIANA: <Router> OPLATA WSZYSTKO ---
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        
        {/* WARUNEK LOGOWANIA W ŚRODKU ROUTERA */}
        {!token ? (
          <Login setToken={(t) => { setToken(t); localStorage.setItem('token', t); }} />
        ) : (
          <>
            {/* --- APLIKACJA DLA ZALOGOWANYCH --- */}
            <header
              style={{
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #ddd',
              }}
            >
              <h1>HRmonogram Admin Panel</h1>
              <nav style={{ marginTop: '10px' }}>
                <Link to="/">Dashboard</Link> |{' '}
                
                {isGlobalAdmin && (
                  <>
                    <Link to="/create-user">Create User</Link> |{' '}
                  </>
                )}

                {/* Ukrywamy Employees dla zwykłego pracownika */}
                {role !== 'employee' && (
                  <>
                    <Link to="/employees">Employees</Link> |{' '}
                  </>
                )}

                {isGlobalAdmin && (
                  <>
                    <Link to="/manage-objects">Manage Objects</Link> |{' '}
                  </>
                )}

                {/* Ukrywamy Schedules dla zwykłego pracownika */}
                {role !== 'employee' && (
                   <>
                     <Link to="/schedules">Manage Work Schedules</Link> |{' '}
                   </>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'blue',
                    textDecoration: 'underline',
                  }}
                >
                  Logout
                </button>
              </nav>
            </header>

            <main style={{ padding: '20px' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                {/* Trasa do zmiany hasła */}
                <Route path="/change-password" element={<ChangePassword token={token} />} />

                <Route 
                  path="/create-user" 
                  element={isGlobalAdmin ? <CreateUser token={token} /> : <Navigate to="/" />} 
                />
                
                <Route path="/employees" element={<Employees token={token} />} />
                
                <Route 
                  path="/manage-objects" 
                  element={isGlobalAdmin ? <ManageObjects token={token} /> : <Navigate to="/" />} 
                />
                
                <Route path="/schedules" element={<Schedules token={token} />} />
                <Route path="/schedules/:objectId" element={<ObjectSchedules token={token} />} />
                <Route path="/schedule/create/:objectId" element={<CreateSchedule token={token} />} />
                <Route path="/schedule/edit/:objectId/:scheduleId" element={<CreateSchedule token={token} />} />
                <Route path="/schedules/settings/:objectId" element={<SchedulePreferences token={token} />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;