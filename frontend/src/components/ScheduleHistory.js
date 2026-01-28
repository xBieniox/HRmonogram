import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasAccess } from '../authUtils';

const ScheduleHistory = ({ token }) => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (!hasAccess(token, ['admin', 'global_hr', 'local_hr'], objectId)) {
          alert("Brak uprawnień do tego zasobu.");
          navigate('/');
      }
  }, [token, navigate, objectId]);

  useEffect(() => {
    fetchHistory();
    
  }, [objectId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/schedules/active/${objectId}?view=history`, {
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
    if (!window.confirm("⚠️ Czy na pewno chcesz trwale usunąć ten archiwalny grafik? Operacja jest nieodwracalna.")) return;
    
    try {
        const res = await fetch(`http://127.0.0.1:5000/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
            setSchedules(prev => prev.filter(s => s.id !== scheduleId));
            alert("Grafik został usunięty z archiwum.");
        } else {
            const data = await res.json();
            alert("Błąd: " + (data.message || "Nie udało się usunąć."));
        }
    } catch (e) { 
        console.error(e);
        alert("Błąd połączenia z serwerem.");
    }
  };

  if (loading) return <div>Ładowanie archiwum...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0, color: '#666' }}>Archiwum Grafików</h2>
        
        <button 
            onClick={() => navigate(`/schedules/${objectId}`)}
            style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
            &larr; Wróć do aktualnych
        </button>
      </div>

      {schedules.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
              Brak archiwalnych grafików.
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {schedules.map((sched) => (
              <div 
                key={sched.id} 
                style={{ 
                    background: '#f9f9f9', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px',
                    color: '#555',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
              >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{sched.title}</h3>
                        <span style={{ 
                            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                            background: '#eee', border: '1px solid #ccc'
                        }}>
                            Archiwum
                        </span>
                    </div>
                    
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        📅 {sched.start_date} - {sched.end_date}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        Typ: {sched.type === 'monthly' ? 'Miesięczny' : 'Tygodniowy'}
                    </p>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate(`/schedule/edit/${objectId}/${sched.id}`)}
                        style={{ flex: 1, padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Podgląd
                    </button>
                    
                    <button
                        onClick={() => handleDelete(sched.id)}
                        style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        title="Usuń trwale"
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

export default ScheduleHistory;