import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import CreateUser from './components/CreateUser';
import ManageObjects from './components/ManageObjects';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Employees from './components/Employees';
import Schedules from './components/Schedules';
import ObjectSchedules from './components/ObjectSchedules';
import CreateSchedule from './components/CreateNewSchedule';
import ChangePassword from './components/ChangePassword'; 
import SchedulePreferences from './components/SchedulePreferences';
import ScheduleHistory from './components/ScheduleHistory';
import EmployeeDashboard from './components/EmployeeDashboard';
import { getUserRole } from './authUtils';

// --- IMPORT LOGO ---
import logo from './logo.png';

// Komponent NavLink do ładniejszego stylowania aktywnych linków
const NavLink = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/'); // Proste sprawdzenie aktywności
    
    return (
        <Link 
            to={to} 
            style={{ 
                textDecoration: 'none', 
                color: isActive ? '#007bff' : '#555', 
                fontWeight: isActive ? 'bold' : 'normal',
                padding: '8px 12px',
                borderRadius: '4px',
                transition: 'background-color 0.2s, color 0.2s',
                backgroundColor: isActive ? '#e7f1ff' : 'transparent'
            }}
            onMouseEnter={(e) => { if(!isActive) e.target.style.color = '#007bff'; }}
            onMouseLeave={(e) => { if(!isActive) e.target.style.color = '#555'; }}
        >
            {children}
        </Link>
    );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (token) {
      setRole(getUserRole(token));
    } else {
      setRole(null);
    }
  }, [token]);

  const isGlobalAdmin = role === 'admin' || role === 'global_hr';
  const isEmployee = role === 'employee';
  const isLocalHR = role === 'local_hr';

  const handleLogin = (newToken) => {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setRole(getUserRole(newToken));
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  };

  return (
    <Router>
      <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        
        {!token ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <header
              style={{
                padding: '0 30px',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                height: '64px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1000
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/*LOGO APLIKACJI*/}
                  <img 
                    src={logo} 
                    alt="Logo" 
                    style={{ 
                        height: '75px', // Wys
                        width: 'auto',
                        objectFit: 'contain'
                    }} 
                  />
                  
                  <h1 style={{ margin: 0, fontSize: '20px', color: '#333', fontWeight: '600' }}>HRmonogram</h1>
              </div>

              <nav style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                
                
                <NavLink to="/">
                    {isGlobalAdmin ? "Pulpit" : "Mój Grafik"}
                </NavLink>
                
                
                {isGlobalAdmin && (
                  <>
                    <NavLink to="/create-user">Dodaj Użytkownika</NavLink>
                    <NavLink to="/manage-objects">Obiekty</NavLink>
                  </>
                )}

                
                {!isEmployee && (
                  <>
                    <NavLink to="/employees">Pracownicy</NavLink>
                    <NavLink to="/schedules">Grafiki</NavLink>
                  </>
                )}

                <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 10px' }}></div>

                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to="/change-password" style={{ textDecoration: 'none', color: '#666', fontSize: '14px' }}>
                        Zmień hasło
                    </Link>

                    <button
                    onClick={handleLogout}
                    style={{
                        border: 'none',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                    Wyloguj
                    </button>
                </div>
              </nav>
            </header>

            <main style={{ padding: '30px' }}>
              <Routes>
                {/* GŁÓWNA TRASA */}
                <Route 
                    path="/" 
                    element={
                        (isEmployee || isLocalHR) 
                            ? <EmployeeDashboard token={token} /> 
                            : <Dashboard token={token} />
                    } 
                />
                
                <Route path="/change-password" element={<ChangePassword token={token} />} />

                {/* Trasy Admina */}
                <Route 
                  path="/create-user" 
                  element={isGlobalAdmin ? <CreateUser token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                  path="/manage-objects" 
                  element={isGlobalAdmin ? <ManageObjects token={token} /> : <Navigate to="/" />} 
                />
                
                {/* Trasy HR */}
                <Route 
                    path="/employees" 
                    element={!isEmployee ? <Employees token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedules" 
                    element={!isEmployee ? <Schedules token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedules/:objectId" 
                    element={!isEmployee ? <ObjectSchedules token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedule/create/:objectId" 
                    element={!isEmployee ? <CreateSchedule token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedule/edit/:objectId/:scheduleId" 
                    element={!isEmployee ? <CreateSchedule token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedules/settings/:objectId" 
                    element={!isEmployee ? <SchedulePreferences token={token} /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/schedules/history/:objectId" 
                    element={!isEmployee ? <ScheduleHistory token={token} /> : <Navigate to="/" />} 
                />

                <Route path="/my-schedule" element={<EmployeeDashboard token={token} />} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;