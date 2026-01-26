import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ManageObjects = ({ token }) => {
  const navigate = useNavigate();
  
  // --- STANY ---
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedDeptName, setSelectedDeptName] = useState(null); // Do wyświetlania nagłówka listy pracowników

  // Formularze
  const [objectName, setObjectName] = useState('');
  const [objectLocation, setObjectLocation] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  // --- 1. BEZPIECZEŃSTWO ---
  useEffect(() => {
    const role = getRoleFromToken(token);
    if (role !== 'admin' && role !== 'global_hr') {
        navigate('/'); // Wyrzuć nieuprawnionych
    } else {
        fetchObjects();
    }
    // eslint-disable-next-line
  }, [token]);

  const getRoleFromToken = (jwtToken) => {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload).sub?.role;
    } catch { return null; }
  };

  // --- API CALLS ---

  const fetchObjects = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/objects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if(response.ok) setObjects(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchDepartments = async (objectId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if(response.ok) setDepartments(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchEmployeesForObject = async (objectId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if(response.ok) {
          setEmployees(await response.json());
          setSelectedDeptName(null); // Reset filtra
      }
    } catch (error) { console.error(error); }
  };

  const fetchEmployeesForDepartment = async (objectId, departmentId, deptName) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/departments/${departmentId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if(response.ok) {
          setEmployees(await response.json());
          setSelectedDeptName(deptName);
      }
    } catch (error) { console.error(error); }
  };

  // --- AKCJE (TWORZENIE / USUWANIE) ---

  const handleCreateObject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5000/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: objectName, location: objectLocation }),
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchObjects();
        setObjectName('');
        setObjectLocation('');
      } else {
        alert(data.message || "Błąd tworzenia obiektu");
      }
    } catch (error) { console.error(error); }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!selectedObject) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/objects/${selectedObject.id}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: departmentName }),
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchDepartments(selectedObject.id);
        setDepartmentName('');
      } else {
        // TU WYŚWIETLAMY BŁĄD O DUPLIKACIE
        alert(data.message || "Błąd tworzenia departamentu");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteObject = async (id, e) => {
    e.stopPropagation(); // Żeby nie otwierać obiektu przy kliknięciu usuń
    if(!window.confirm("Czy na pewno usunąć ten obiekt?")) return;

    try {
      await fetch(`http://127.0.0.1:5000/objects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchObjects();
    } catch (error) { console.error(error); }
  };

  const handleDeleteDepartment = async (id) => {
    if(!window.confirm("Usunąć departament?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedObject) fetchDepartments(selectedObject.id);
    } catch (error) { console.error(error); }
  };

  // --- WIDOKI ---

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. WIDOK LISTY OBIEKTÓW */}
      {!selectedObject ? (
        <>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Zarządzanie Obiektami
          </h2>
          
          {/* Formularz dodawania */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Dodaj Nowy Obiekt</h3>
            <form onSubmit={handleCreateObject} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nazwa Obiektu:</label>
                <input
                  type="text"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Lokalizacja:</label>
                <input
                  type="text"
                  value={objectLocation}
                  onChange={(e) => setObjectLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <button type="submit" style={{ padding: '9px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Utwórz
              </button>
            </form>
          </div>

          {/* Lista kafelków */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {objects.map((obj) => (
              <div 
                key={obj.id} 
                onClick={() => {
                    setSelectedObject(obj);
                    fetchDepartments(obj.id);
                    fetchEmployeesForObject(obj.id);
                }}
                style={{ 
                    background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                    cursor: 'pointer', border: '1px solid #eee', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{obj.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>📍 {obj.location || 'Brak lokalizacji'}</p>
                    </div>
                    <button 
                        onClick={(e) => handleDeleteObject(obj.id, e)}
                        style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Usuń
                    </button>
                </div>
                <div style={{ marginTop: '15px', color: '#007bff', fontSize: '14px', fontWeight: 'bold' }}>
                    Zarządzaj &rarr;
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 2. WIDOK SZCZEGÓŁÓW OBIEKTU */
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '24px', margin: 0 }}>
               Obiekt: <span style={{ color: '#007bff' }}>{selectedObject.name}</span>
            </h2>
            <button 
                onClick={() => setSelectedObject(null)}
                style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                &larr; Wróć do listy
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
             
             {/* LEWA KOLUMNA: DEPARTAMENTY */}
             <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0 }}>Departamenty</h3>
                
                <form onSubmit={handleCreateDepartment} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Nowy dział..."
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        required
                        style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        +
                    </button>
                </form>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li 
                        onClick={() => fetchEmployeesForObject(selectedObject.id)}
                        style={{ 
                            padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', 
                            background: !selectedDeptName ? '#eef' : 'transparent', fontWeight: !selectedDeptName ? 'bold' : 'normal'
                        }}
                    >
                        🏢 Wszystkie działy
                    </li>
                    {departments.map((dep) => (
                        <li key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <span 
                                onClick={() => fetchEmployeesForDepartment(selectedObject.id, dep.id, dep.name)}
                                style={{ 
                                    cursor: 'pointer', flex: 1, 
                                    color: selectedDeptName === dep.name ? '#007bff' : 'inherit',
                                    fontWeight: selectedDeptName === dep.name ? 'bold' : 'normal'
                                }}
                            >
                                {dep.name}
                            </span>
                            <button 
                                onClick={() => handleDeleteDepartment(dep.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                                title="Usuń dział"
                            >
                                🗑️
                            </button>
                        </li>
                    ))}
                    {departments.length === 0 && <li style={{ padding: '10px', color: '#999', fontSize: '13px' }}>Brak działów.</li>}
                </ul>
             </div>

             {/* PRAWA KOLUMNA: PRACOWNICY */}
             <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>
                    Pracownicy {selectedDeptName ? `(Dział: ${selectedDeptName})` : '(Cały obiekt)'}
                </h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' }}>Imię i Nazwisko</th>
                            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' }}>Rola</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{emp.name}</td>
                                <td style={{ padding: '10px', color: '#666' }}>{emp.email}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{ 
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                                        background: emp.role === 'admin' ? '#f8d7da' : emp.role === 'local_hr' ? '#fff3cd' : '#d4edda',
                                        color: emp.role === 'admin' ? '#721c24' : emp.role === 'local_hr' ? '#856404' : '#155724'
                                    }}>
                                        {emp.role}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                    Brak pracowników w tym widoku.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>

          </div>
        </>
      )}
    </div>
  );
};

export default ManageObjects;