import React, { useState, useEffect } from 'react';

const UserDetails = ({ userId, token, onBack, canEdit }) => {
  const [user, setUser] = useState(null);
  
  // Listy do selectów
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contracts, setContracts] = useState(['Umowa o Pracę', 'Umowa Zlecenie', 'Umowa B2B']);

  const [loading, setLoading] = useState(true);

  // Stan do przechowywania hasła po resecie
  const [newGeneratedPassword, setNewGeneratedPassword] = useState(null);

  // Formularz
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    object_id: '',
    department_id: '',
    contract_type: ''
  });

  useEffect(() => {
    fetchData();
    if (canEdit) {
        fetchObjects();
    }
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
      setNewGeneratedPassword(null);
  }, [userId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        
        setFormData({
            name: data.name,
            email: data.email,
            role: data.role,
            object_id: data.object_id || '',
            department_id: data.department_id || '',
            contract_type: data.contract_type || ''
        });

        if (data.object_id && canEdit) {
            fetchDepartments(data.object_id);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjects = async () => {
      try {
          const res = await fetch('http://127.0.0.1:5000/objects', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) setObjects(await res.json());
      } catch(e) { console.error(e); }
  };

  const fetchDepartments = async (objectId) => {
      try {
          const res = await fetch(`http://127.0.0.1:5000/objects/${objectId}/departments`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if(res.ok) setDepartments(await res.json());
          else setDepartments([]);
      } catch(e) { 
          console.error(e); 
          setDepartments([]);
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'object_id') {
        setFormData(prev => ({ ...prev, object_id: value, department_id: '' }));
        if (value) {
            fetchDepartments(value);
        } else {
            setDepartments([]);
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- TUTAJ WPROWADZILIŚMY ZMIANĘ ---
  const handleSave = async () => {
      try {
          const payload = {
              ...formData,
              object_id: formData.object_id || null,
              department_id: formData.department_id || null,
              contract_type: formData.contract_type || null
          };

          const res = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify(payload)
          });

          // Niezależnie czy sukces czy błąd, próbujemy odczytać odpowiedź JSON
          const data = await res.json();

          if (res.ok) {
              alert("Zaktualizowano pomyślnie!");
              onBack();
          } else {
              // Wyświetlamy konkretny komunikat błędu z backendu
              alert("Błąd aktualizacji: " + (data.message || "Wystąpił nieznany problem."));
          }
      } catch (e) { 
          console.error(e);
          alert("Błąd połączenia z serwerem.");
      }
  };
  // -----------------------------------

  const handleDelete = async () => {
      if (!window.confirm(`Czy na pewno chcesz usunąć pracownika: ${formData.name}?`)) {
          return;
      }
      
      if (!window.confirm("⚠️ UWAGA: Ta operacja jest nieodwracalna! Czy na pewno kontynuować?")) {
          return;
      }

      try {
          const res = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
              alert("Pracownik został usunięty.");
              onBack(); 
          } else {
              const data = await res.json();
              alert("Błąd: " + (data.message || "Nie udało się usunąć."));
          }
      } catch (e) {
          console.error(e);
          alert("Błąd połączenia z serwerem.");
      }
  };

  const handleResetPassword = async () => {
      if (!window.confirm(`Czy na pewno chcesz zresetować hasło dla użytkownika ${formData.name}?`)) {
          return;
      }

      try {
          const res = await fetch(`http://127.0.0.1:5000/users/${userId}/reset-password`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
          });

          const data = await res.json();

          if (res.ok) {
              setNewGeneratedPassword(data.new_password);
          } else {
              alert("Błąd resetowania hasła: " + data.message);
          }
      } catch (e) {
          console.error(e);
          alert("Błąd połączenia z serwerem.");
      }
  };

  const copyToClipboard = () => {
      if (newGeneratedPassword) {
          navigator.clipboard.writeText(newGeneratedPassword);
          alert("Hasło skopiowane do schowka!");
      }
  };

  if (loading) return <div>Ładowanie danych...</div>;
  if (!user) return <div>Nie znaleziono użytkownika.</div>;

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Szczegóły Pracownika</h2>
        <button onClick={onBack} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            Wróć
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* LEWA KOLUMNA */}
          <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Imię i Nazwisko</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                disabled={!canEdit}
                style={{ width: '100%', padding: '8px', marginBottom: '15px', background: !canEdit ? '#eee' : '#fff' }} 
              />

              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email</label>
              <input 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                disabled={!canEdit}
                style={{ width: '100%', padding: '8px', marginBottom: '15px', background: !canEdit ? '#eee' : '#fff' }} 
              />
              
               <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Rola</label>
               {canEdit ? (
                   <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
                   >
                       <option value="employee">Pracownik</option>
                       <option value="local_hr">Local HR</option>
                       <option value="global_hr">Global HR</option>
                       <option value="admin">Administrator</option>
                   </select>
               ) : (
                   <div style={{ padding: '8px', background: '#eee', marginBottom: '15px' }}>{formData.role}</div>
               )}
          </div>

          {/* PRAWA KOLUMNA */}
          <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Obiekt</label>
              {canEdit ? (
                  <select 
                    name="object_id" 
                    value={formData.object_id} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
                  >
                      <option value="">-- Brak / Wybierz --</option>
                      {objects.map(obj => (
                          <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                  </select>
              ) : (
                  <div style={{ padding: '8px', background: '#eee', marginBottom: '15px' }}>
                      {objects.find(o => o.id === parseInt(formData.object_id))?.name || "Brak / Brak uprawnień"}
                  </div>
              )}

              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Departament</label>
              {canEdit ? (
                  <select 
                    name="department_id" 
                    value={formData.department_id} 
                    onChange={handleChange}
                    disabled={!formData.object_id}
                    style={{ 
                        width: '100%', padding: '8px', marginBottom: '15px',
                        backgroundColor: !formData.object_id ? '#e9ecef' : 'white',
                        cursor: !formData.object_id ? 'not-allowed' : 'pointer'
                    }}
                  >
                      <option value="">-- Brak / Wybierz --</option>
                      {departments.map(dep => (
                          <option key={dep.id} value={dep.id}>{dep.name}</option>
                      ))}
                  </select>
              ) : (
                  <div style={{ padding: '8px', background: '#eee', marginBottom: '15px' }}>
                       ID Działu: {formData.department_id || "Brak"}
                  </div>
              )}

              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Typ Umowy</label>
              {canEdit ? (
                  <select 
                    name="contract_type" 
                    value={formData.contract_type} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
                  >
                      <option value="">-- Brak --</option>
                      {contracts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              ) : (
                  <div style={{ padding: '8px', background: '#eee', marginBottom: '15px' }}>{formData.contract_type || "-"}</div>
              )}
          </div>
      </div>

      {canEdit && (
          <>
            {newGeneratedPassword && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    border: '1px solid #c3e6cb', 
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <strong>Hasło zostało zresetowane!</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '18px', background: 'white', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            {newGeneratedPassword}
                        </span>
                        <button 
                            onClick={copyToClipboard}
                            style={{ padding: '5px 10px', background: '#155724', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Skopiuj
                        </button>
                    </div>
                    <small style={{textAlign: 'center', marginTop: '5px'}}>
                        Przekaż hasło pracownikowi. <br/>
                        Przy logowaniu system <b>wymusi</b> jego zmianę.
                    </small>
                </div>
            )}

            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleDelete}
                        style={{ 
                            padding: '10px 20px', fontSize: '14px', background: '#dc3545', color: 'white', 
                            border: 'none', borderRadius: '4px', cursor: 'pointer' 
                        }}
                    >
                        🗑️ Usuń Pracownika
                    </button>

                    <button 
                        onClick={handleResetPassword}
                        style={{ 
                            padding: '10px 20px', fontSize: '14px', background: '#ffc107', color: 'black', 
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                        }}
                    >
                        🔑 Resetuj Hasło
                    </button>
                </div>

                <button 
                    onClick={handleSave}
                    style={{ 
                        padding: '10px 20px', fontSize: '16px', background: '#28a745', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Zapisz Zmiany
                </button>
            </div>
          </>
      )}
    </div>
  );
};

export default UserDetails;