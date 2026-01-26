import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Schedules = ({ token }) => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Dekodowanie tokena, aby poznać rolę i ID użytkownika
    const role = getRoleFromToken(token);
    const userId = getUserIdFromToken(token);

    if (role === 'employee') {
        // Zwykły pracownik nie ma tu wstępu
        navigate('/');
        return;
    }

    if (role === 'local_hr') {
        // --- LOGIKA DLA LOCAL HR ---
        // Musimy pobrać dane użytkownika, aby dowiedzieć się, jaki ma object_id
        fetchUserDataAndRedirect(userId);
    } else {
        // --- LOGIKA DLA ADMIN / GLOBAL HR ---
        // Oni widzą listę wszystkich obiektów
        fetchObjects();
    }
    // eslint-disable-next-line
  }, [token]);

  // Pomocnicze funkcje do tokena
  const getRoleFromToken = (jwtToken) => {
    try {
      const payload = JSON.parse(decodeURIComponent(window.atob(jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      return payload.sub?.role;
    } catch { return null; }
  };

  const getUserIdFromToken = (jwtToken) => {
    try {
      const payload = JSON.parse(decodeURIComponent(window.atob(jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      // Zakładam, że backend w 'sub' trzyma słownik {id: ..., role: ...}
      // Jeśli 'sub' to tylko ID (int), to zwróć payload.sub
      return payload.sub?.id || payload.sub; 
    } catch { return null; }
  };

  // Funkcja dla Local HR: Pobierz dane usera -> Przekieruj do jego obiektu
  const fetchUserDataAndRedirect = async (userId) => {
      try {
          const response = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
              const user = await response.json();
              if (user.object_id) {
                  // PRZEKIEROWANIE: Od razu do widoku grafiku tego obiektu
                  navigate(`/schedules/${user.object_id}`);
              } else {
                  alert("Jesteś Local HR, ale nie masz przypisanego obiektu!");
                  setLoading(false); // Zatrzymujemy ładowanie, żeby wyświetlić komunikat
              }
          } else {
              console.error("Błąd pobierania danych użytkownika");
              setLoading(false);
          }
      } catch (e) {
          console.error(e);
          setLoading(false);
      }
  };

  // Funkcja dla Admina: Pobierz listę obiektów
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
      console.error('Error fetching objects:', error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
      return <div style={{padding: '20px'}}>Ładowanie...</div>;
  }

  // Widok listy obiektów (Tylko dla Admin / Global HR)
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