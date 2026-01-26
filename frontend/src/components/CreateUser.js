import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateUser = ({ token }) => {
  const navigate = useNavigate();
  
  // Stany formularza
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [contractType, setContractType] = useState('');
  
  // Stany dla Obiektów i Departamentów
  const [objectId, setObjectId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  
  // Listy do wyboru
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  // --- 1. SPRAWDZANIE UPRAWNIEŃ I POBIERANIE OBIEKTÓW ---
  useEffect(() => {
    const userRole = getRoleFromToken(token);

    // Jeśli to nie Admin i nie Global HR -> Wyrzuć do listy pracowników
    if (userRole !== 'admin' && userRole !== 'global_hr') {
        alert("Brak uprawnień do tworzenia użytkowników.");
        navigate('/employees');
    } else {
        // Jeśli ma uprawnienia, pobierz listę obiektów do selecta
        fetchObjects();
    }
    // eslint-disable-next-line
  }, [token]);

  // Funkcja dekodująca token (pomocnicza)
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

  const fetchObjects = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/objects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setObjects(data);
      }
    } catch (err) { console.error(err); }
  };

  // Pobieranie departamentów po wybraniu obiektu
  const handleObjectChange = async (e) => {
      const selectedObjId = e.target.value;
      setObjectId(selectedObjId);
      setDepartmentId(''); // Reset departamentu przy zmianie obiektu
      setDepartments([]);

      if (selectedObjId) {
          try {
              const response = await fetch(`http://127.0.0.1:5000/objects/${selectedObjId}/departments`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                  const data = await response.json();
                  setDepartments(data);
              }
          } catch (err) { console.error(err); }
      }
  };

  const handleGeneratePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    const randomPassword = Array(12)
      .fill('')
      .map(() => characters[Math.floor(Math.random() * characters.length)])
      .join('');
    setPassword(randomPassword);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Przygotowanie danych (wysyłamy null, jeśli puste stringi)
      const payload = {
          email,
          password,
          name,
          role,
          contract_type: contractType || null,
          object_id: objectId || null,
          department_id: departmentId || null
      };

      const response = await fetch('http://127.0.0.1:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`User created successfully! Temporary password: ${data.password}`);
        // Reset formularza
        setEmail('');
        setPassword('');
        setName('');
        setRole('employee');
        setContractType('');
        setObjectId('');
        setDepartmentId('');
        navigate('/employees'); // Przekierowanie po sukcesie
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Create User</h2>
      <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Imię i Nazwisko */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)} required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {/* Hasło */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
                type="text" value={password} onChange={(e) => setPassword(e.target.value)} required 
                style={{ flex: 1, padding: '8px' }}
            />
            <button type="button" onClick={handleGeneratePassword} style={{ padding: '8px' }}>
              Generate
            </button>
          </div>
        </div>

        {/* Rola */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="employee">Employee</option>
            <option value="local_hr">Local HR</option>
            <option value="global_hr">Global HR</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Typ Umowy */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contract Type:</label>
          <select value={contractType} onChange={(e) => setContractType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Contract...</option>
            <option value="Umowa o Pracę">Umowa o Pracę</option>
            <option value="Umowa Zlecenie">Umowa Zlecenie</option>
            <option value="Umowa B2B">Umowa B2B</option>
          </select>
        </div>

        {/* Wybór Obiektu */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Object:</label>
          <select value={objectId} onChange={handleObjectChange} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Object...</option>
            {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>

        {/* Wybór Departamentu (aktywny tylko po wybraniu obiektu) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Department:</label>
          <select 
            value={departmentId} 
            onChange={(e) => setDepartmentId(e.target.value)} 
            disabled={!objectId}
            style={{ width: '100%', padding: '8px', backgroundColor: !objectId ? '#f0f0f0' : 'white' }}
          >
            <option value="">Select Department...</option>
            {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
        </div>

        <button 
            type="submit" 
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
        >
            Create User
        </button>
      </form>
    </div>
  );
};

export default CreateUser;