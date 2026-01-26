import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ScheduleHistory = ({ token }) => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  
  const [historyList, setHistoryList] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null); // Tutaj trzymamy szczegóły otwartego grafiku
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pobierz listę przy wejściu
  useEffect(() => {
    fetchHistory();
    fetchEmployees();
  }, [objectId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/schedules/active/${objectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmployees(Array.isArray(data) ? data : data.employees);
        }
      } catch (err) { console.error(err); }
  };

  // Pobierz szczegóły konkretnego grafiku (shifts)
  const openSchedule = async (scheduleId) => {
      setLoading(true);
      try {
          const response = await fetch(`http://127.0.0.1:5000/work_schedules/${scheduleId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
              const data = await response.json();
              setSelectedSchedule(data);
          }
      } catch (err) {
          alert("Błąd pobierania szczegółów grafiku");
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async (scheduleId) => {
      if (!window.confirm("⚠️ CZY NA PEWNO CHCESZ USUNĄĆ TEN GRAFIK?\n\nTa operacja jest nieodwracalna i usunie wszystkie przypisane do niego zmiany pracowników.")) {
          return;
      }
      
      try {
          const response = await fetch(`http://127.0.0.1:5000/work_schedules/${scheduleId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
              alert("✅ Grafik usunięty.");
              setSelectedSchedule(null); // Wróć do listy
              fetchHistory(); // Odśwież listę
          } else {
              alert("Błąd usuwania.");
          }
      } catch (err) { console.error(err); }
  };


const handleEdit = () => {
    if (selectedSchedule) {
        // Przekierowanie do trasy, którą stworzyliśmy w Kroku 1
        navigate(`/schedule/edit/${objectId}/${selectedSchedule.id}`);
    }
};

  // --- GENEROWANIE SIATKI (Podgląd) ---
  const renderPreviewGrid = () => {
      if (!selectedSchedule) return null;

      // Generujemy dni na podstawie start_date i end_date
      const start = new Date(selectedSchedule.start_date);
      const end = new Date(selectedSchedule.end_date);
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
      }

      return (
          <div style={{ overflowX: 'auto', marginTop: '20px', border: '1px solid #ddd' }}>
              <table border="1" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                  <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                          <th style={{ padding: '8px', minWidth: '150px', position: 'sticky', left: 0, background: '#f0f0f0', zIndex: 10 }}>Pracownik</th>
                          {days.map((day, i) => (
                              <th key={i} style={{ minWidth: '40px', padding: '4px' }}>
                                  {day.getDate()}<br/>
                                  <span style={{fontSize: '10px', color: '#666'}}>
                                      {day.toLocaleDateString('pl-PL', { weekday: 'short' })}
                                  </span>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {employees.map(emp => (
                          <tr key={emp.id}>
                              <td style={{ padding: '5px', fontWeight: 'bold', textAlign: 'left', position: 'sticky', left: 0, background: 'white', zIndex: 5 }}>
                                  {emp.name}
                              </td>
                              {days.map((day, i) => {
                                  const dateStr = day.toISOString().split('T')[0];
                                  const key = `${emp.id}_${dateStr}`;
                                  const shift = selectedSchedule.shifts[key] || "";
                                  
                                  return (
                                      <td key={i} style={{ padding: '0', height: '30px', background: shift ? '#e6f7ff' : 'white' }}>
                                          {shift}
                                      </td>
                                  );
                              })}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  // --- WIDOK LISTY ---
  if (!selectedSchedule) {
      return (
          <div style={{ padding: '20px' }}>
              <h2 className="text-2xl font-bold mb-6">Historia Grafików</h2>
              
              {loading && <p>Ładowanie...</p>}

              {historyList.length === 0 && !loading && <p>Brak zapisanych grafików.</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {historyList.map(item => (
                      <div 
                          key={item.id} 
                          onClick={() => openSchedule(item.id)}
                          style={{ 
                              border: '1px solid #ddd', borderRadius: '8px', padding: '15px', 
                              cursor: 'pointer', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'transform 0.2s', position: 'relative'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                              <span style={{ 
                                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                  backgroundColor: item.status === 'active' ? '#d4edda' : (item.status === 'future' ? '#cce5ff' : '#e2e3e5'),
                                  color: item.status === 'active' ? '#155724' : (item.status === 'future' ? '#004085' : '#383d41')
                              }}>
                                  {item.status === 'active' ? 'AKTUALNY' : (item.status === 'future' ? 'PRZYSZŁY' : 'ARCHIWALNY')}
                              </span>
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '15px' }}>{item.title}</h3>
                          <p style={{ color: '#666', marginTop: '5px' }}>
                              📅 {item.start_date} ➝ {item.end_date}
                          </p>
                          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                              Typ: {item.type === 'monthly' ? 'Miesięczny' : 'Tygodniowy'}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  // --- WIDOK SZCZEGÓŁÓW ---
  return (
      <div style={{ padding: '20px', background: '#fcfcfc', minHeight: '100vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setSelectedSchedule(null)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '16px', color: '#007bff' }}>
                  ← Wróć do listy
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                      onClick={handleEdit}
                      style={{ padding: '8px 16px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                      ✏️ Edytuj
                  </button>
                  <button 
                      onClick={() => handleDelete(selectedSchedule.id)}
                      style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                      🗑️ Usuń grafik
                  </button>
              </div>
          </div>

          <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h2 className="text-2xl font-bold">{selectedSchedule.title}</h2>
              <p className="text-gray-600">Zakres: {selectedSchedule.start_date} - {selectedSchedule.end_date}</p>
              
              {renderPreviewGrid()}
          </div>
      </div>
  );
};

export default ScheduleHistory;