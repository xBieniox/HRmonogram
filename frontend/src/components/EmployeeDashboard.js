import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = ({ token }) => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('current'); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleGrid, setScheduleGrid] = useState([]);
  
  const [availableSchedules, setAvailableSchedules] = useState({ current: [], upcoming: [], history: [] });

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    fetchLists();
    fetchCurrentSchedule();
    // eslint-disable-next-line
  }, [token]);

  const fetchLists = async () => {
      try {
          const res = await fetch('http://127.0.0.1:5000/schedules/my-list', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              setAvailableSchedules(await res.json());
          }
      } catch (e) { console.error(e); }
  };

  const fetchCurrentSchedule = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://127.0.0.1:5000/schedules/my-current', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status !== 404) setErrorMsg("Nie udało się pobrać domyślnego grafiku.");
        setScheduleData(null);
      } else {
        const data = await res.json();
        setScheduleData(data);
        generateGridFromDates(data.start_date, data.end_date);
      }
    } catch (err) {
      setErrorMsg("Błąd połączenia.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificSchedule = async (id) => {
      setLoading(true);
      setErrorMsg('');
      try {
          const res = await fetch(`http://127.0.0.1:5000/schedules/employee-view/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setScheduleData(data);
              generateGridFromDates(data.start_date, data.end_date);
          } else {
              setErrorMsg("Błąd pobierania.");
          }
      } catch (e) { setErrorMsg("Błąd połączenia."); }
      finally { setLoading(false); }
  };

  const generateGridFromDates = (startStr, endStr) => {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
      }
      setScheduleGrid(days);
  };

  const getDayName = (date) => date.toLocaleDateString('pl-PL', { weekday: 'short' });
  const isSunday = (date) => date.getDay() === 0;

  const renderScheduleTable = () => {
      if (loading) return <div>Ładowanie...</div>;
      if (!scheduleData) return <div style={{padding:'20px', color: '#666'}}>{errorMsg || "Wybierz grafik z listy powyżej."}</div>;

      return (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
              <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{scheduleData.title} ({scheduleData.start_date} - {scheduleData.end_date})</span>
                  
                  <button 
                    onClick={() => setScheduleData(null)}
                    style={{ fontSize: '12px', padding: '5px 10px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                      ✕ Zamknij / Wróć do listy
                  </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                      <tr>
                          <th style={{ textAlign: 'left', padding: '10px', background: '#343a40', color: 'white', position: 'sticky', left: 0, zIndex: 10 }}>
                              Pracownik
                          </th>
                          {scheduleGrid.map((day, i) => {
                              const dateStr = day.toISOString().split('T')[0];
                              const isToday = dateStr === todayStr;
                              
                              return (
                                <th key={i} style={{ 
                                    padding: '5px', minWidth: '40px', textAlign: 'center', 
                                    // USUNIĘTO "DZIŚ", ZOSTAWIONO STYLIZACJĘ:
                                    background: isToday ? '#fff3cd' : '#f8f9fa', 
                                    borderBottom: isToday ? '3px solid #ffc107' : '2px solid #ddd',
                                    borderLeft: isToday ? '2px solid #ffc107' : '1px solid #eee',
                                    borderRight: isToday ? '2px solid #ffc107' : '1px solid #eee',
                                    color: isSunday(day) ? 'red' : 'black',
                                    position: 'relative'
                                }}>
                                    <div>{day.getDate()}</div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>{getDayName(day)}</div>
                                </th>
                              );
                          })}
                      </tr>
                  </thead>
                  <tbody>
                      {scheduleData.employees && scheduleData.employees.map(emp => {
                          const isCurrentUser = emp.id === scheduleData.user_id;
                          return (
                              <tr key={emp.id} style={{ backgroundColor: isCurrentUser ? '#e8f0fe' : 'white' }}>
                                  <td style={{ 
                                      padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', 
                                      position: 'sticky', left: 0, zIndex: 5,
                                      background: isCurrentUser ? '#e8f0fe' : 'white',
                                      borderRight: '2px solid #eee',
                                      color: isCurrentUser ? '#007bff' : 'black'
                                  }}>
                                      {emp.name} {isCurrentUser && "(Ty)"}
                                  </td>
                                  {scheduleGrid.map((day, i) => {
                                      const dateStr = day.toISOString().split('T')[0];
                                      const shift = scheduleData.shifts[`${emp.id}_${dateStr}`] || "";
                                      const isToday = dateStr === todayStr;

                                      return (
                                          <td key={i} style={{ 
                                              textAlign: 'center', height: '30px',
                                              border: '1px solid #eee',
                                              // STYLIZACJA KOMÓREK DLA DZISIAJ:
                                              borderLeft: isToday ? '2px solid #ffc107' : '1px solid #eee',
                                              borderRight: isToday ? '2px solid #ffc107' : '1px solid #eee',
                                              backgroundColor: isToday ? '#fffbeb' : (isSunday(day) ? '#fdfdfd' : 'transparent'),
                                              fontWeight: isToday ? 'bold' : 'normal'
                                          }}>
                                              {shift}
                                          </td>
                                      );
                                  })}
                              </tr>
                          );
                      })}
                  </tbody>
              </table>

              {scheduleData.templates && scheduleData.templates.length > 0 && (
                  <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Legenda skrótów:</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {scheduleData.templates.map((t, index) => (
                              <div key={index} style={{ fontSize: '12px', background: 'white', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '3px' }}>
                                  <strong style={{ color: '#007bff' }}>{t.abbreviation}</strong>: {t.start_time} - {t.end_time}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderList = (listType) => {
      const list = availableSchedules[listType] || [];
      if (list.length === 0) return <div style={{ padding: '20px', color: '#999' }}>Brak grafików w tej sekcji.</div>;

      return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
              {list.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => fetchSpecificSchedule(item.id)}
                    style={{
                        background: 'white', padding: '15px', borderRadius: '8px',
                        border: '1px solid #e0e0e0', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>{item.title}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>📅 {item.start_date} - {item.end_date}</p>
                      <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#007bff', fontWeight: 'bold' }}>Pokaż &rarr;</span>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Podgląd Grafiku</h2>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
          <button 
            onClick={() => { setActiveTab('current'); setScheduleData(null); fetchCurrentSchedule(); }}
            style={{ 
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === 'current' ? '3px solid #007bff' : '3px solid transparent',
                fontWeight: activeTab === 'current' ? 'bold' : 'normal', color: activeTab === 'current' ? '#007bff' : '#555'
            }}
          >
              Aktualne
          </button>
          <button 
            onClick={() => { setActiveTab('upcoming'); setScheduleData(null); }}
            style={{ 
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === 'upcoming' ? '3px solid #007bff' : '3px solid transparent',
                fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', color: activeTab === 'upcoming' ? '#007bff' : '#555'
            }}
          >
              Nadchodzące
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setScheduleData(null); }}
            style={{ 
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === 'history' ? '3px solid #007bff' : '3px solid transparent',
                fontWeight: activeTab === 'history' ? 'bold' : 'normal', color: activeTab === 'history' ? '#007bff' : '#555'
            }}
          >
              Historia
          </button>
      </div>

      {activeTab === 'current' && (
          <div>
              {scheduleData ? renderScheduleTable() : renderList('current')}
          </div>
      )}

      {activeTab === 'upcoming' && (
          <div>
              {scheduleData ? renderScheduleTable() : renderList('upcoming')}
          </div>
      )}

      {activeTab === 'history' && (
          <div>
              {scheduleData ? renderScheduleTable() : renderList('history')}
          </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;