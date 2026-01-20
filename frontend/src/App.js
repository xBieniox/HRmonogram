import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateUser from './components/CreateUser';
import ManageObjects from './components/ManageObjects';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Employees from './components/Employees';
import Schedules from './components/Schedules';
import ObjectSchedules from './components/ObjectSchedules'; // Import widoku szczegółów obiektu

const App = () => {
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setToken(null);
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
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
            <Link to="/create-user">Create User</Link> |{' '}
            <Link to="/employees">Employees</Link> |{' '}
            <Link to="/manage-objects">Manage Objects</Link> |{' '}
            <Link to="/schedules">Manage Work Schedules</Link> |{' '}
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
            <Route path="/create-user" element={<CreateUser token={token} />} />
            <Route path="/employees" element={<Employees token={token} />} />
            <Route path="/manage-objects" element={<ManageObjects token={token} />} />
            <Route path="/schedules" element={<Schedules token={token} />} />
            <Route path="/schedules/:objectId" element={<ObjectSchedules token={token} />} />
            
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
