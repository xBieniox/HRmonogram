import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAccess } from '../authUtils';

const CreateUser = ({ token }) => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [contractType, setContractType] = useState('');
  
  const [objectId, setObjectId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!hasAccess(token, ['admin', 'global_hr'])) {
        navigate('/employees');
    } else {
        fetchObjects();
    }
  }, [token, navigate]);

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

  const handleObjectChange = async (e) => {
      const selectedObjId = e.target.value;
      setObjectId(selectedObjId);
      setDepartmentId(''); 
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
        navigate('/employees'); 
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again.');
    }
  };

  const inputStyle = {
      width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'
  };

  const labelStyle = {
      display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#333'
  };

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Utwórz Nowego Użytkownika</h2>
                <button 
                    onClick={() => navigate('/employees')}
                    style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Anuluj
                </button>
            </div>

            <form onSubmit={handleCreateUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    
                    <div>
                        <label style={labelStyle}>Imię i Nazwisko</label>
                        <input 
                            type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                            style={inputStyle} placeholder="np. Jan Kowalski"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Adres Email</label>
                        <input 
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                            style={inputStyle} placeholder="jan.kowalski@firma.pl"
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Hasło</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" value={password} onChange={(e) => setPassword(e.target.value)} required 
                                style={{ ...inputStyle, fontFamily: 'monospace' }}
                                placeholder="Wpisz lub wygeneruj..."
                            />
                            <button 
                                type="button" onClick={handleGeneratePassword} 
                                style={{ padding: '0 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Generuj
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Rola w systemie</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                            <option value="employee">Pracownik (Employee)</option>
                            <option value="local_hr">Local HR</option>
                            <option value="global_hr">Global HR</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Typ Umowy</label>
                        <select value={contractType} onChange={(e) => setContractType(e.target.value)} style={inputStyle}>
                            <option value="">-- Wybierz --</option>
                            <option value="Umowa o Pracę">Umowa o Pracę</option>
                            <option value="Umowa Zlecenie">Umowa Zlecenie</option>
                            <option value="Umowa B2B">Umowa B2B</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Przypisz do Obiektu</label>
                        <select value={objectId} onChange={handleObjectChange} style={inputStyle}>
                            <option value="">-- Brak / Nie dotyczy --</option>
                            {objects.map(obj => (
                                <option key={obj.id} value={obj.id}>{obj.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Przypisz do Departamentu</label>
                        <select 
                            value={departmentId} 
                            onChange={(e) => setDepartmentId(e.target.value)} 
                            disabled={!objectId}
                            style={{ ...inputStyle, backgroundColor: !objectId ? '#e9ecef' : 'white' }}
                        >
                            <option value="">-- Wybierz --</option>
                            {departments.map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.name}</option>
                            ))}
                        </select>
                    </div>

                </div>

                <div style={{ textAlign: 'right', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    <button 
                        type="submit" 
                        style={{ padding: '12px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        Utwórz Użytkownika
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default CreateUser;