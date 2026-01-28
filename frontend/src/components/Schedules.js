import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getUserObjectId } from '../authUtils';

const Schedules = ({ token }) => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = getUserRole(token);
    const userObjectId = getUserObjectId(token);

    if (role === 'employee') {
        navigate('/');
        return;
    }

    if (role === 'local_hr') {
        if (userObjectId) {
            navigate(`/schedules/${userObjectId}`);
        } else {
            alert("Błąd konfiguracji konta Local HR. Brak przypisanego obiektu.");
            navigate('/');
        }
        return;
    }

    fetchObjects();
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
    } catch (error) {
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
      return <div style={{padding: '20px'}}>Ładowanie...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Wybierz Obiekt do Zarządzania Grafikami</h2>
      
      {objects.length === 0 && <p>Brak obiektów w systemie.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => navigate(`/schedules/${obj.id}`)}
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              backgroundColor: 'white',
              transition: 'transform 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{obj.name}</h3>
            {obj.location && <p style={{ color: '#666' }}>📍 {obj.location}</p>}
            <button
                style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Otwórz Grafiki
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedules;