import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = ({ token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Hasła nie są identyczne!");
      return;
    }

  // ...
  try {
    // ZMIANA ADRESU URL (teraz korzystamy z endpointu w auth.py)
    const response = await fetch('http://127.0.0.1:5000/first-password-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ new_password: newPassword })
    });
// ...

      const data = await response.json();

      if (response.ok) {
        alert("Hasło zostało zmienione pomyślnie. Możesz teraz korzystać z systemu.");
        navigate('/'); // Przekieruj do Dashboardu
      } else {
        alert("Błąd: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Błąd połączenia z serwerem.");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{textAlign: 'center', color: '#d9534f'}}>Wymagana Zmiana Hasła</h2>
      <p style={{textAlign: 'center', marginBottom: '20px', color: '#666'}}>
        To Twoje pierwsze logowanie. Ze względów bezpieczeństwa musisz ustawić nowe, własne hasło.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{display: 'block', marginBottom: '5px'}}>Nowe Hasło:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{display: 'block', marginBottom: '5px'}}>Potwierdź Hasło:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button 
            type="submit" 
            style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
            Zmień Hasło i Zaloguj
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;