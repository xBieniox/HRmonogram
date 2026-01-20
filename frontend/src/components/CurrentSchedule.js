import React, { useState, useEffect } from 'react';

const CurrentSchedule = ({ token, objectId }) => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchCurrentSchedule();
  }, []);

  const fetchCurrentSchedule = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/schedules/current?object_id=${objectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSchedule(data.schedule);
    } catch (error) {
      console.error('Error fetching current schedule:', error);
    }
  };

  return (
    <div>
      <h3>Current Schedule</h3>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Shift</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.employeeName}</td>
              <td>{entry.date}</td>
              <td>{entry.shift}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentSchedule;
