import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook do nawigacji

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 1. Backend zwraca teraz klucz 'token', a nie 'access_token'
        const token = data.token;

        // 2. Zapisz dane w LocalStorage
        // Zapisujemy sam token (dla App.js przy odświeżeniu) oraz cały obiekt usera
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data)); 
        
        // 3. Zaktualizuj stan aplikacji (przekazany z App.js)
        setToken(token);
        
        // 4. SPRAWDZENIE FLAGI ZMIANY HASŁA
        if (data.must_change_password) {
            // Jeśli flaga jest true -> przekieruj do zmiany hasła
            navigate('/change-password');
        } else {
            // Jeśli false -> normalnie do Dashboardu
            navigate('/'); 
        }

      } else {
        alert(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button 
            type="submit"
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
            Login
        </button>
      </form>
    </div>
  );
};

export default Login;