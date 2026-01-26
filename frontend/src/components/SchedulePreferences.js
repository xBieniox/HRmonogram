import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SchedulePreferences = ({ token }) => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Stan preferencji
  const [preferences, setPreferences] = useState({
    work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    schedule_type: 'monthly',
    daily_hours_limit: 8,
    min_employees_per_shift: 1,
    holidays_included: false,
  });
  
  // Stan szablonów
  const [templates, setTemplates] = useState([]);
  
  // Stan formularza nowego szablonu
  const [newTemplate, setNewTemplate] = useState({ abbreviation: '', start_time: '', end_time: '' });

  useEffect(() => {
    if (objectId && token) {
        fetchData();
    }
    // eslint-disable-next-line
  }, [objectId, token]);

  const fetchData = async () => {
      try {
          const res = await axios.get(`http://127.0.0.1:5000/schedules/settings/${objectId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          const data = res.data;
          
          setPreferences({
              work_days: data.preference.work_days || [],
              schedule_type: data.preference.schedule_type,
              daily_hours_limit: data.preference.daily_hours_limit,
              min_employees_per_shift: data.preference.min_employees_per_shift || 1,
              holidays_included: data.preference.holidays_included || false
          });

          // Upewniamy się, że szablony to tablica
          if (Array.isArray(data.templates)) {
              setTemplates(data.templates);
          } else {
              setTemplates([]);
          }
          
      } catch (error) {
          console.error("Błąd pobierania ustawień:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDayChange = (day) => {
    setPreferences(prev => {
      const newDays = prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day];
      return { ...prev, work_days: newDays };
    });
  };

  const handleAddTemplate = () => {
      if (newTemplate.abbreviation && newTemplate.start_time && newTemplate.end_time) {
          setTemplates(prev => [...prev, newTemplate]);
          setNewTemplate({ abbreviation: '', start_time: '', end_time: '' });
      } else {
          alert("Wypełnij wszystkie pola szablonu!");
      }
  };

  const handleDeleteTemplate = (index) => {
      setTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
        const payload = {
            preference: preferences,
            templates: templates
        };

        await axios.post(`http://127.0.0.1:5000/schedules/settings/${objectId}`, payload, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            }
        });

        setMessage('Zapisano preferencje!');
        setTimeout(() => navigate(`/schedules/${objectId}`), 1500);

    } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.message || 'Błąd połączenia.';
        setMessage(`Błąd zapisu: ${errorMsg}`);
    }
  };

  if (loading) return <div>Ładowanie ustawień...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Preferencje Grafiku</h2>
          <button 
            onClick={() => navigate(`/schedules/${objectId}`)}
            style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
              Anuluj
          </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* LEWA KOLUMNA - USTAWIENIA OGÓLNE */}
        <div>
            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Typ Grafiku:</label>
                <select 
                    name="schedule_type" 
                    value={preferences.schedule_type} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                    <option value="monthly">Miesięczny</option>
                    <option value="weekly">Tygodniowy</option>
                </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Dzienny Limit Godzin:</label>
                <input 
                    type="number" 
                    name="daily_hours_limit" 
                    value={preferences.daily_hours_limit} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Min. pracowników na zmianie:</label>
                <input 
                    type="number" 
                    name="min_employees_per_shift" 
                    value={preferences.min_employees_per_shift} 
                    onChange={handleChange}
                    min="1"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            </div>

            {/* --- NOWE POLE: ŚWIĘTA --- */}
            <div style={{ marginBottom: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input 
                        type="checkbox" 
                        name="holidays_included"
                        checked={preferences.holidays_included}
                        onChange={handleChange}
                        style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                    />
                    Uwzględniaj pracę w święta
                </label>
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                    Jeśli zaznaczone, system nie będzie ostrzegał przy planowaniu pracy w dni ustawowo wolne.
                </small>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Dni Robocze:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer', padding: '5px', border: '1px solid #eee', borderRadius: '4px', background: preferences.work_days.includes(day) ? '#e6f7ff' : 'white' }}>
                            <input 
                                type="checkbox" 
                                checked={preferences.work_days.includes(day)}
                                onChange={() => handleDayChange(day)}
                            /> {day}
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* PRAWA KOLUMNA - SZABLONY */}
        <div>
            <div style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
                <h4 style={{ marginTop: 0 }}>Definicje Zmian (Szablony)</h4>
                <p style={{ fontSize: '12px', color: '#666' }}>Zdefiniuj skróty, np. "R" dla 06:00-14:00.</p>
                
                <div style={{ display: 'flex', gap: '5px', alignItems: 'end', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px' }}>Skrót</label>
                        <input 
                            type="text" 
                            placeholder="np. R" 
                            value={newTemplate.abbreviation}
                            onChange={(e) => setNewTemplate({...newTemplate, abbreviation: e.target.value})}
                            style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '12px' }}>Godziny</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                                type="time" 
                                value={newTemplate.start_time}
                                onChange={(e) => setNewTemplate({...newTemplate, start_time: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                            />
                            <span>-</span>
                            <input 
                                type="time" 
                                value={newTemplate.end_time}
                                onChange={(e) => setNewTemplate({...newTemplate, end_time: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </div>
                    </div>
                    <button onClick={handleAddTemplate} style={{ padding: '6px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        +
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'white' }}>
                    <thead>
                        <tr style={{ background: '#eee', textAlign: 'left' }}>
                            <th style={{ padding: '5px' }}>Skrót</th>
                            <th style={{ padding: '5px' }}>Godziny</th>
                            <th style={{ padding: '5px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map((t, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '5px', fontWeight: 'bold' }}>{t.abbreviation}</td>
                                <td style={{ padding: '5px' }}>{t.start_time} - {t.end_time}</td>
                                <td style={{ padding: '5px', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => handleDeleteTemplate(index)}
                                        style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                                    >
                                        &times;
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {templates.length === 0 && (
                            <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Brak szablonów</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'right' }}>
          {message && <span style={{ marginRight: '15px', color: message.includes('Błąd') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</span>}
          <button 
            onClick={handleSave} 
            style={{ padding: '10px 25px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            Zapisz Ustawienia
          </button>
      </div>
    </div>
  );
};

export default SchedulePreferences;