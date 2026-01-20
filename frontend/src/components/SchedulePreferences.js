import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SchedulePreferences = ({ token }) => {
  const { objectId } = useParams();
  const [shifts, setShifts] = useState([]);
  const [workDays, setWorkDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [scheduleType, setScheduleType] = useState("weekly");
  const [maxHoursPerEmployee, setMaxHoursPerEmployee] = useState(40);
  const [minEmployeesPerShift, setMinEmployeesPerShift] = useState(1);
  const [holidaysIncluded, setHolidaysIncluded] = useState(false);

  const [formData, setFormData] = useState({
    abbreviation: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    if (objectId) {
      fetchShifts();
      fetchPreferences();
    }
  }, [objectId]);

  const fetchShifts = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/shifts/${objectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/preferences/${objectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkDays(data.work_days);
        setScheduleType(data.schedule_type);
        setMaxHoursPerEmployee(data.max_hours_per_employee);
        setMinEmployeesPerShift(data.min_employees_per_shift);
        setHolidaysIncluded(data.holidays_included);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkDaysChange = (day) => {
    setWorkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSavePreferences = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/preferences/${objectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          work_days: workDays,
          schedule_type: scheduleType,
          max_hours_per_employee: maxHoursPerEmployee,
          min_employees_per_shift: minEmployeesPerShift,
          holidays_included: holidaysIncluded
        }),
      });

      if (response.ok) {
        alert("Preferences saved successfully!");
      } else {
        alert("Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const handleSaveShift = async () => {
    if (!objectId) {
      alert("Error: Object ID is missing!");
      console.error("Error: objectId is undefined!");
      return;
    }

    const requestData = {
      object_id: objectId,
      abbreviation: formData.abbreviation,
      start_time: formData.start_time,
      end_time: formData.end_time,
    };

    try {
      const response = await fetch(`http://127.0.0.1:5000/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert('Shift template added successfully!');
        fetchShifts();
      } else {
        const errorData = await response.json();
        alert(`Failed to add shift: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  return (
    <div>
      <h3>Schedule Preferences for Object {objectId}</h3>
      
      <h4>Select Work Days</h4>
      <div>
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={workDays.includes(day)}
              onChange={() => handleWorkDaysChange(day)}
            />
            {day}
          </label>
        ))}
      </div>

      <h4>Select Schedule Type</h4>
      <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <h4>Max Hours per Employee</h4>
      <input type="number" value={maxHoursPerEmployee} onChange={(e) => setMaxHoursPerEmployee(Number(e.target.value))} />

      <h4>Min Employees per Shift</h4>
      <input type="number" value={minEmployeesPerShift} onChange={(e) => setMinEmployeesPerShift(Number(e.target.value))} />

      <h4>Include Holidays</h4>
      <input type="checkbox" checked={holidaysIncluded} onChange={(e) => setHolidaysIncluded(e.target.checked)} />

      <button onClick={handleSavePreferences}>Save Preferences</button>
      
      <h4>Manage Shift Templates</h4>
      <table>
        <thead>
          <tr>
            <th>Abbreviation</th>
            <th>Start Time</th>
            <th>End Time</th>
          </tr>
        </thead>
        <tbody>
          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.abbreviation}</td>
                <td>{shift.start_time}</td>
                <td>{shift.end_time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No shifts available</td>
            </tr>
          )}
        </tbody>
      </table>
      
      <h4>Add New Shift Template</h4>
      <input type="text" name="abbreviation" placeholder="Shortcut (e.g., N)" onChange={handleInputChange} />
      <input type="time" name="start_time" onChange={handleInputChange} />
      <input type="time" name="end_time" onChange={handleInputChange} />
      <button onClick={handleSaveShift}>Add Shift</button>
    </div>
  );
};

export default SchedulePreferences;
