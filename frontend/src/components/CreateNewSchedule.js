import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const CreateSchedule = ({ token }) => {
  const { objectId } = useParams();
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('');
  const [month, setMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [scheduleGrid, setScheduleGrid] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchPreferences();
    fetchHolidays();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        setSelectedEmployees(data.map(emp => emp.id));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/preferences/${objectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkingDays(data.work_days);
        setScheduleType(data.schedule_type);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchHolidays = async () => {
    setHolidays(["2025-01-01", "2025-04-20", "2025-05-01", "2025-12-25"]);
  };

  const generateScheduleGrid = () => {
    if (!month && scheduleType === "monthly") return;
    if (!startDate && scheduleType === "weekly") return;

    let daysInRange = [];
    let start;

    if (scheduleType === 'monthly') {
      start = new Date(`${month}-01`);
      let monthIndex = start.getMonth();
      while (start.getMonth() === monthIndex) {
        daysInRange.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    } else if (scheduleType === 'weekly') {
      start = new Date(startDate);
      for (let i = 0; i < 7; i++) {
        daysInRange.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }

    setScheduleGrid(daysInRange);
  };

  return (
    <div>
      <h2>Create Work Schedule</h2>

      <label>Schedule Name:</label>
      <input type="text" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} />

      {scheduleType === 'monthly' && (
        <>
          <label>Select Month:</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </>
      )}

      {scheduleType === 'weekly' && (
        <>
          <label>Select Start Date:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </>
      )}

      <h3>Select Employees</h3>
      {employees.map(emp => (
        <label key={emp.id}>
          <input
            type="checkbox"
            checked={selectedEmployees.includes(emp.id)}
            onChange={() =>
              setSelectedEmployees(prev =>
                prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
              )
            }
          />
          {emp.name}
        </label>
      ))}

      <button onClick={generateScheduleGrid}>Generate Schedule</button>

      {scheduleGrid.length > 0 && (
        <div>
          <h3>Schedule for {scheduleName}</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Name</th>
                {scheduleGrid.map((day, index) => (
                  <th key={index} style={{ backgroundColor: holidays.includes(day.toISOString().split('T')[0]) ? 'red' : (workingDays.includes(day.toLocaleDateString('en-US', { weekday: 'long' })) ? '#f0f0f0' : '#ccc') }}>
                    {day.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedEmployees.map(empId => {
                const employee = employees.find(e => e.id === empId);
                return (
                  <tr key={empId}>
                    <td>{employee?.name}</td>
                    {scheduleGrid.map((day, index) => (
                      <td key={index} style={{ backgroundColor: holidays.includes(day.toISOString().split('T')[0]) ? 'red' : (workingDays.includes(day.toLocaleDateString('en-US', { weekday: 'long' })) ? 'white' : '#ccc') }}></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreateSchedule;
