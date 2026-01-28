import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasAccess } from '../authUtils';

const ObjectSchedules = ({ token }) => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [objectName, setObjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    if (!hasAccess(token, ['admin', 'global_hr', 'local_hr'], objectId)) {
        navigate('/');
        return;
    }

    fetchSchedules();
    fetchObjectName();
    
  }, [objectId, token, navigate]);

  const fetchObjectName = async () => {
      try {
          const res = await fetch(`http://127.0.0.1:5000/objects/${objectId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              
              const data = await res.json(); 
              setObjectName(data.name);
          }
      } catch (e) { console.error(e); }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/schedules/active/${objectId}?view=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Czy na pewno usunąć ten grafik?")) return;
    try {
        const res = await fetch(`http://127.0.0.1:5000/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            fetchSchedules();
        } else {
            alert("Nie udało się usunąć grafiku.");
        }
    } catch (e) { console.error(e); }
  };

  const handleTogglePublish = async (scheduleId, currentStatus, title) => {
      const action = currentStatus ? "wycofać publikację" : "opublikować";
      if (!window.confirm(`Czy na pewno chcesz ${action} grafik "${title}"?`)) return;

      try {
          const res = await fetch(`http://127.0.0.1:5000/schedules/${scheduleId}/publish`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` }
          });
          
         
          const data = await res.json();

          if (res.ok) {
              setSchedules(prev => prev.map(s => 
                  s.id === scheduleId ? { ...s, is_published: data.is_published } : s
              ));
              alert(data.message);
          } else {
              alert("Błąd: " + data.message);
          }
      } catch (e) {
          console.error(e);
          alert("Błąd połączenia z serwerem.");
      }
  };

  if (loading) return <div>Ładowanie grafików...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>Grafiki: <span style={{color: '#007bff'}}>{objectName}</span></h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={() => navigate('/schedules')}
                style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                &larr; Wróć
            </button>
            
            <button 
                onClick={() => navigate(`/schedules/history/${objectId}`)}
                style={{ padding: '8px 15px', background: '#6610f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                📜 Historia
            </button>

            <button 
                onClick={() => navigate(`/schedules/settings/${objectId}`)}
                style={{ padding: '8px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                ⚙️ Preferencje
            </button>

            <button 
                onClick={() => navigate(`/schedule/create/${objectId}`)}
                style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                + Nowy Grafik
            </button>
        </div>
      </div>

      {schedules.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
              Brak aktywnych grafików. Sprawdź historię lub utwórz nowy.
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {schedules.map((sched) => (
              <div 
                key={sched.id} 
                style={{ 
                    background: '#fff', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
              >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{sched.title}</h3>
                        <span style={{ 
                            fontSize: '12px', padding: '3px 8px', borderRadius: '10px',
                            backgroundColor: sched.is_published ? '#d4edda' : '#fff3cd',
                            color: sched.is_published ? '#155724' : '#856404',
                            border: `1px solid ${sched.is_published ? '#c3e6cb' : '#ffeeba'}`
                        }}>
                            {sched.is_published ? 'Opublikowany' : 'Szkic'}
                        </span>
                    </div>
                    
                    <p style={{ color: '#666', margin: '5px 0', fontSize: '14px' }}>
                        📅 {sched.start_date} - {sched.end_date}
                    </p>
                    <p style={{ color: '#666', margin: '5px 0', fontSize: '14px' }}>
                        Typ: {sched.type === 'monthly' ? 'Miesięczny' : 'Tygodniowy'}
                    </p>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate(`/schedule/edit/${objectId}/${sched.id}`)}
                        style={{ flex: 1, padding: '8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Edytuj
                    </button>

                    <button
                        onClick={() => handleTogglePublish(sched.id, sched.is_published, sched.title)}
                        style={{ 
                            flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            background: sched.is_published ? '#ffc107' : '#17a2b8',
                            color: sched.is_published ? 'black' : 'white'
                        }}
                    >
                        {sched.is_published ? 'Wycofaj' : 'Opublikuj'}
                    </button>

                    <button
                        onClick={() => handleDelete(sched.id)}
                        style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        title="Usuń grafik"
                    >
                        🗑️
                    </button>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default ObjectSchedules;