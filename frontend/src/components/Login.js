import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => { // Odbieramy onLogin zamiast setToken
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Upewnij się, że adres portu (5000) jest zgodny z Twoim backendem
      const response = await fetch('http://127.0.0.1:5000/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Logowanie udane
        // Wywołujemy funkcję z App.js przekazując sam token string
        if (onLogin) {
            onLogin(data.token);
        }
        navigate('/'); // Przekierowanie na stronę główną (App.js zdecyduje co pokazać)
      } else {
        // Błąd logowania (np. 401)
        setError(data.message || 'Błąd logowania');
      }
    } catch (err) {
      console.error(err);
      setError('Błąd połączenia z serwerem');
    }
  };

  return (
    <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' 
    }}>
      <div style={{ 
          padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Logowanie</h2>
        
        {error && (
            <div style={{ 
                backgroundColor: '#ffebe9', color: '#cc0033', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' 
            }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          
          <button 
            type="submit" 
            style={{ 
                width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;