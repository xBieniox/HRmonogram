import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Stats data:", data); // Debug w konsoli
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Ładowanie pulpitu...</div>;
  if (!stats) return <div style={{ padding: '40px', textAlign: 'center' }}>Błąd pobierania danych.</div>;

  // --- KOMPONENTY UI ---
  const Card = ({ title, value, icon, color }) => (
    <div style={{ 
        background: 'white', padding: '25px', borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px',
        borderLeft: `5px solid ${color}`
    }}>
        <div style={{ fontSize: '32px' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{value}</div>
        </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
      let bg = '#eee';
      let color = '#333';
      let text = 'Nieznany';

      // Normalizacja statusu (małe litery)
      const s = status ? status.toLowerCase() : '';

      if (s === 'ok' || s === 'active') {
          bg = '#d4edda'; color = '#155724'; text = 'Aktualny';
      } else if (s === 'future') {
          bg = '#cce5ff'; color = '#004085'; text = 'Zaplanowany';
      } else if (s === 'outdated') {
          bg = '#fff3cd'; color = '#856404'; text = 'Nieaktualny';
      } else if (s === 'missing') {
          bg = '#f8d7da'; color = '#721c24'; text = 'Brak grafiku';
      } else {
          // Jeśli status jest inny, pokażmy go surowego dla debugowania
          text = status;
      }

      return (
          <span style={{ backgroundColor: bg, color: color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              {text}
          </span>
      );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>Pulpit Zarządzania</h2>

      {/* 1. KAFELKI KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <Card title="Pracownicy" value={stats.employees_count} icon="👥" color="#007bff" />
          <Card title="Obiekty" value={stats.objects_count} icon="🏢" color="#6610f2" />
          <Card title="Aktywne Grafiki" value={stats.active_schedules} icon="📅" color="#28a745" />
          <Card title="Braki w Grafikach" value={stats.missing_schedules} icon="⚠️" color="#dc3545" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          {/* 2. LISTA OBIEKTÓW I STATUSY */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Status Obiektów</h3>
                  <Link to="/schedules" style={{ fontSize: '13px', color: '#007bff', textDecoration: 'none' }}>Zarządzaj &rarr;</Link>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                      <tr>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: '#666' }}>Obiekt</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: '#666' }}>Lokalizacja</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: '#666' }}>Zakres Grafiku</th>
                          <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: '#666' }}>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {stats.objects_status.map(obj => (
                          <tr key={obj.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{obj.name}</td>
                              <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>{obj.location || '-'}</td>
                              <td style={{ padding: '12px', fontSize: '13px' }}>{obj.last_schedule}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <StatusBadge status={obj.status} />
                              </td>
                          </tr>
                      ))}
                      {stats.objects_status.length === 0 && (
                          <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Brak obiektów</td></tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* 3. SZYBKIE AKCJE */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 20px 0' }}>Szybkie Akcje</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to="/create-user" style={actionButtonStyle}>
                      <span>👤</span> Dodaj Pracownika
                  </Link>
                  <Link to="/manage-objects" style={actionButtonStyle}>
                      <span>🏢</span> Dodaj Obiekt
                  </Link>
                  <Link to="/schedules" style={actionButtonStyle}>
                      <span>🗓️</span> Przeglądaj Grafiki
                  </Link>
                  <Link to="/employees" style={actionButtonStyle}>
                      <span>📋</span> Lista Pracowników
                  </Link>
              </div>
          </div>

      </div>
    </div>
  );
};

const actionButtonStyle = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 15px', textDecoration: 'none', color: '#444',
    background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee',
    fontWeight: '600', transition: 'all 0.2s'
};

export default Dashboard;