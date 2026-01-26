import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CurrentSchedule = ({ token, objectId }) => {
  const [employees, setEmployees] = useState([]);
  const [todaysShifts, setTodaysShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pobieramy dzisiejszą datę w formacie YYYY-MM-DD
  const todayDate = new Date().toISOString().slice(0, 10);

  const authConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    if (!objectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Pobieramy pracowników
        const empRes = await axios.get(`http://127.0.0.1:5000/employees?object_id=${objectId}&per_page=100`, authConfig);
        const allEmployees = empRes.data.employees || [];
        setEmployees(allEmployees);

        // 2. Pobieramy grafik na obecny miesiąc
        const currentMonth = todayDate.slice(0, 7); // YYYY-MM
        const schedRes = await axios.get(`http://127.0.0.1:5000/schedules/${objectId}/${currentMonth}`, authConfig);
        const allSchedules = schedRes.data || [];

        // 3. Filtrujemy tylko zmiany na DZISIAJ
        const todayOnly = allSchedules.filter(s => s.date === todayDate);
        setTodaysShifts(todayOnly);

      } catch (error) {
        console.error("Error fetching today's schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [objectId]);

  // Pomocnicza funkcja do znalezienia zmiany dla pracownika
  const getShiftForEmployee = (empId) => {
    const shift = todaysShifts.find(s => s.employee_id === empId);
    return shift ? shift.shift : null;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        📅 Dziś jest: {todayDate}
      </h3>

      {loading ? <p>Ładowanie...</p> : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          {employees.map(emp => {
            const shift = getShiftForEmployee(emp.id);
            if (!shift) return null; // Nie pokazuj osób, które nie mają dziś zmiany (opcjonalne)

            return (
              <li key={emp.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '10px', 
                borderBottom: '1px solid #eee',
                backgroundColor: '#f9f9f9',
                marginBottom: '5px',
                borderRadius: '4px'
              }}>
                <span style={{ fontWeight: 'bold' }}>{emp.name}</span>
                <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>{shift}</span>
              </li>
            );
          })}
          {todaysShifts.length === 0 && (
            <p style={{ color: '#888', fontStyle: 'italic' }}>Brak zaplanowanych zmian na dzisiaj.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default CurrentSchedule;