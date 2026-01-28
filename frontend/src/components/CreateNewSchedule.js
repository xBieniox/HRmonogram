import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasAccess } from '../authUtils';

const CreateSchedule = ({ token }) => {
  const { objectId, scheduleId } = useParams();
  const navigate = useNavigate();
  
  const [scheduleName, setScheduleName] = useState('');
  
  const [scheduleType, setScheduleType] = useState('monthly'); 
  const [dailyLimit, setDailyLimit] = useState(8);
  const [minEmployees, setMinEmployees] = useState(1);
  const [holidaysIncluded, setHolidaysIncluded] = useState(false);
  const [workingDays, setWorkingDays] = useState([]);
  
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [scheduleGrid, setScheduleGrid] = useState([]);

  const [scheduleData, setScheduleData] = useState({}); 
  const [editingCell, setEditingCell] = useState(null);
  
  const [shiftTemplates, setShiftTemplates] = useState({}); 
  const [rawTemplates, setRawTemplates] = useState([]); 

  useEffect(() => {
    if (!hasAccess(token, ['admin', 'global_hr', 'local_hr'], objectId)) {
        navigate('/');
        return;
    }

    if (objectId) {
        fetchEmployees();
        fetchContext();
    }
    // eslint-disable-next-line
  }, [objectId, scheduleId, token, navigate]);

  useEffect(() => {
    if (scheduleId) {
        fetchScheduleForEdit(scheduleId);
    }
  }, [scheduleId]);

  const fetchContext = async () => {
      try {
          let url = `http://127.0.0.1:5000/schedules/context?object_id=${objectId}`;
          if (scheduleId) {
              url += `&schedule_id=${scheduleId}`;
          }

          const response = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
              const data = await response.json();
              
              const pref = data.preference || {};
              setWorkingDays(pref.work_days || []);
              setScheduleType(pref.schedule_type || 'monthly');
              setDailyLimit(pref.daily_hours_limit || 8);
              setMinEmployees(pref.min_employees_per_shift !== undefined ? pref.min_employees_per_shift : 1);
              setHolidaysIncluded(pref.holidays_included !== undefined ? pref.holidays_included : false);

              const templatesList = data.templates || [];
              setRawTemplates(templatesList);

              const templatesMap = {};
              templatesList.forEach(t => {
                  const start = parseTime(t.start_time);
                  const end = parseTime(t.end_time);
                  if (!isNaN(start) && !isNaN(end)) {
                      let duration = end - start;
                      if (duration < 0) duration += 24; 
                      templatesMap[t.abbreviation] = {
                          hours: duration,
                          start: start,
                          end: end
                      };
                  }
              });
              setShiftTemplates(templatesMap);
          }
      } catch (error) {
          console.error(error);
      }
  };

  const fetchScheduleForEdit = async (id) => {
      try {
          const response = await fetch(`http://127.0.0.1:5000/work_schedules/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
              const data = await response.json();
              
              setScheduleName(data.title);
              setScheduleType(data.type); 
              setScheduleData(data.shifts);

              if (data.type === 'monthly') {
                  setMonth(data.start_date.slice(0, 7));
                  generateGridFromDates(data.start_date, data.end_date);
              } else {
                  setStartDate(data.start_date);
                  generateGridFromDates(data.start_date, data.end_date);
              }
          }
      } catch (err) {
          console.error(err);
          alert("Nie udało się wczytać grafiku.");
      }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const empList = Array.isArray(data) ? data : (data.employees || []);
        setEmployees(empList);
        setSelectedEmployees(empList.map(emp => emp.id));
      }
    } catch (error) { console.error(error); }
  };

  const fetchExistingSchedule = async () => {
    if (scheduleId) return; 
    if (!month) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/schedules/${objectId}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const dataMap = {};
        data.forEach(item => {
            dataMap[`${item.employee_id}_${item.date}`] = item.shift;
        });
        setScheduleData(dataMap);
      }
    } catch (error) { console.error(error); }
  };

  const generateGridFromDates = (startStr, endStr) => {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
      }
      setScheduleGrid(days);
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
      if (!scheduleId) fetchExistingSchedule();
    } else if (scheduleType === 'weekly') {
      start = new Date(startDate);
      for (let i = 0; i < 7; i++) {
        daysInRange.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }
    setScheduleGrid(daysInRange);
  };

  const getPolishHolidays = (year) => {
      const holidays = [
          `${year}-01-01`, `${year}-01-06`, `${year}-05-01`, `${year}-05-03`, 
          `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`, `${year}-12-26`
      ];
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const p = (h + l - 7 * m + 114) % 31;
      const day = p + 1;
      const monthEaster = Math.floor((h + l - 7 * m + 114) / 31);
      const easterDate = new Date(year, monthEaster - 1, day);
      
      const easterMonday = new Date(easterDate);
      easterMonday.setDate(easterMonday.getDate() + 1);
      holidays.push(easterMonday.toISOString().split('T')[0]);

      const corpusChristi = new Date(easterDate);
      corpusChristi.setDate(corpusChristi.getDate() + 60);
      holidays.push(corpusChristi.toISOString().split('T')[0]);

      return holidays;
  };

  useEffect(() => {
      const year = month ? parseInt(month.split('-')[0]) : (startDate ? parseInt(startDate.split('-')[0]) : new Date().getFullYear());
      setHolidays(getPolishHolidays(year));
  }, [month, startDate]);

  useEffect(() => {
      if (!scheduleId && scheduleGrid.length > 0) {
          fetchExistingSchedule(); 
      }
  }, [month, startDate]);

  const getEmployeesByDept = () => {
    const groups = {};
    employees.forEach(emp => {
        const dept = emp.department_name || emp.department || "Pozostali";
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(emp);
    });
    return groups;
  };

  const toggleDepartment = (deptName, empIdsInDept) => {
    const allSelected = empIdsInDept.every(id => selectedEmployees.includes(id));
    if (allSelected) {
        setSelectedEmployees(prev => prev.filter(id => !empIdsInDept.includes(id)));
    } else {
        const newSelected = new Set([...selectedEmployees, ...empIdsInDept]);
        setSelectedEmployees(Array.from(newSelected));
    }
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return NaN;
    const parts = timeStr.trim().split(':');
    let h = parseInt(parts[0], 10);
    let m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (h < 0 || h > 24 || m < 0 || m >= 60) return NaN;
    return h + m / 60;
  };

  const getShiftDetails = (shiftStr) => {
      if (!shiftStr || typeof shiftStr !== 'string' || shiftStr.trim() === '') return null;
      const trimmed = shiftStr.trim();
      
      if (shiftTemplates[trimmed]) return shiftTemplates[trimmed]; 
      
      if (trimmed.includes('-')) {
          const parts = trimmed.split('-');
          if (parts.length !== 2) return null;
          const start = parseTime(parts[0]);
          const end = parseTime(parts[1]);
          if (isNaN(start) || isNaN(end)) return null;
          let duration = end - start;
          if (duration < 0) duration += 24; 
          return { start, end, hours: duration };
      }
      const val = parseFloat(trimmed);
      if (!isNaN(val) && val > 0 && val <= 24) {
          return { start: 8, end: (8 + val) % 24, hours: val };
      }
      return null;
  };

  const isDayBlocked = (dayDate) => {
      const dateStr = dayDate.toISOString().split('T')[0];
      const dayNameEng = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isHoliday = holidays.includes(dateStr);
      if (isHoliday && !holidaysIncluded) return true;
      if (!workingDays.includes(dayNameEng)) return true;
      return false;
  };

  const getStaffCountForDay = (dateStr) => {
      let count = 0;
      selectedEmployees.forEach(empId => {
          const shiftVal = scheduleData[`${empId}_${dateStr}`];
          if (shiftVal && shiftVal.trim() !== "") {
              count++;
          }
      });
      return count;
  };

  const validateLaborCode = (empId, dateStr, currentShiftVal) => {
      const violations = [];
      const currentDetails = getShiftDetails(currentShiftVal);
      if (!currentDetails) return []; 

      if (currentDetails.hours > dailyLimit) violations.push(`Przekroczono limit dobowy ${dailyLimit}h!`);
      if (currentDetails.hours > 24) violations.push("Błąd: Praca powyżej 24h!");

      const currDateObj = new Date(dateStr);
      const prevDateObj = new Date(currDateObj);
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevDateStr = prevDateObj.toISOString().split('T')[0];
      const prevShiftVal = scheduleData[`${empId}_${prevDateStr}`];
      const prevDetails = getShiftDetails(prevShiftVal);

      if (prevDetails) {
          let effectivePrevEnd = prevDetails.end;
          if (prevDetails.end < prevDetails.start) effectivePrevEnd += 24;
          let rest = (currentDetails.start + 24) - effectivePrevEnd;
          if (rest < 11) violations.push(`Brak 11h odpoczynku! Przerwa: ${rest.toFixed(1)}h`);
          
          let timeSincePrevStart = (currentDetails.start + 24) - prevDetails.start;
          if (timeSincePrevStart < 24) violations.push(`Łamanie doby pracowniczej!`);
      }

      const dayOfWeek = currDateObj.getDay(); 
      const diffToMon = (dayOfWeek + 6) % 7; 
      const monday = new Date(currDateObj);
      monday.setDate(currDateObj.getDate() - diffToMon);
      
      let weekHours = 0;
      for (let i = 0; i < 7; i++) {
          const tempDate = new Date(monday);
          tempDate.setDate(monday.getDate() + i);
          const dStr = tempDate.toISOString().split('T')[0];
          let sVal = (dStr === dateStr) ? currentShiftVal : (scheduleData[`${empId}_${dStr}`] || "");
          const dDet = getShiftDetails(sVal);
          if (dDet) weekHours += dDet.hours;
      }
      if (weekHours > 48) violations.push(`Przekroczony limit tygodniowy 48h! Suma: ${weekHours}h`);

      if (dayOfWeek === 0 && currentDetails.hours > 0) {
          const sundaysInView = scheduleGrid.filter(d => d.getDay() === 0);
          let hasFreeSunday = false;
          for (const sun of sundaysInView) {
              const sStr = sun.toISOString().split('T')[0];
              if (sStr === dateStr) continue; 
              const sVal = scheduleData[`${empId}_${sStr}`];
              const sDet = getShiftDetails(sVal);
              if (!sVal || (sDet && sDet.hours === 0)) {
                  hasFreeSunday = true;
                  break;
              }
          }
          if (!hasFreeSunday && sundaysInView.length >= 4) violations.push(`Brak wolnej niedzieli w miesiącu!`);
      }

      return violations;
  };

  const calculateTotalHours = (empId) => {
    let total = 0;
    scheduleGrid.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const shift = scheduleData[`${empId}_${dateStr}`];
        const details = getShiftDetails(shift);
        if (details) total += details.hours;
    });
    return total;
  };

  const handleFinalSave = async () => {
    let errorCount = 0;
    let incompleteDays = 0;

    scheduleGrid.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        if (!isDayBlocked(day)) {
            const staffCount = getStaffCountForDay(dateStr);
            if (staffCount < minEmployees) incompleteDays++;
        }
        selectedEmployees.forEach(empId => {
            const shiftVal = scheduleData[`${empId}_${dateStr}`];
            if (!shiftVal || shiftVal.trim() === "") return;
            const details = getShiftDetails(shiftVal);
            const isFormatValid = details !== null;
            const violations = validateLaborCode(empId, dateStr, shiftVal);
            if (!isFormatValid || violations.length > 0) errorCount++;
        });
    });

    if (errorCount > 0) {
        alert(`❌ Nie można zatwierdzić grafiku!\n\nWykryto ${errorCount} błędów. Popraw je.`);
        return;
    }

    if (incompleteDays > 0) {
        if (!window.confirm(`⚠️ Grafik NIEKOMPLETNY (${incompleteDays} dni ze słabą obsadą).\nCzy na pewno chcesz zapisać?`)) return;
    }

    let startDateStr = "";
    if (scheduleType === 'monthly' && month) {
        startDateStr = `${month}-01`;
    } else if (scheduleType === 'weekly' && startDate) {
        startDateStr = startDate;
    }

    if (!startDateStr || !scheduleName) {
        alert("Brak nazwy lub daty!");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/schedules/bulk_save', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                object_id: objectId,
                schedule_id: scheduleId || null,
                schedule_name: scheduleName,
                start_date: startDateStr,
                shifts: scheduleData 
            })
        });

        if (response.ok) {
            alert("✅ Grafik został pomyślnie zapisany!");
            navigate(`/schedules/${objectId}`);
        } else {
            const errData = await response.json();
            alert("❌ Błąd zapisu: " + (errData.message || "Nieznany błąd"));
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("❌ Błąd połączenia z serwerem.");
    }
  };

  const startEditing = (empId, dateStr) => setEditingCell({ empId, dateStr });
  const handleInputChange = (e, empId, dateStr) => setScheduleData(prev => ({ ...prev, [`${empId}_${dateStr}`]: e.target.value }));
  
  const saveChange = async (empId, dateStr) => {
    setEditingCell(null);
  };

  const handleKeyDown = (e, currentEmpId, currentDateStr) => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape'];
    if (!keys.includes(e.key)) return;
    if (e.key === 'Escape') { setEditingCell(null); return; }
    if (e.key !== 'Tab') e.preventDefault(); 
    const rowIdx = selectedEmployees.indexOf(currentEmpId);
    const colIdx = scheduleGrid.findIndex(d => d.toISOString().split('T')[0] === currentDateStr);
    if (rowIdx === -1 || colIdx === -1) return;
    let nextRow = rowIdx; let nextCol = colIdx;
    if (e.key === 'ArrowUp') nextRow = rowIdx - 1;
    if (e.key === 'ArrowDown' || e.key === 'Enter') nextRow = rowIdx + 1;
    if (e.key === 'ArrowLeft') nextCol = colIdx - 1;
    if (e.key === 'ArrowRight') nextCol = colIdx + 1;
    if (e.key === 'Tab') nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
    if (nextCol >= scheduleGrid.length) { nextCol = 0; nextRow++; }
    if (nextCol < 0) { nextCol = scheduleGrid.length - 1; nextRow--; }
    if (nextRow >= 0 && nextRow < selectedEmployees.length) {
        setEditingCell({ empId: selectedEmployees[nextRow], dateStr: scheduleGrid[nextCol].toISOString().split('T')[0] });
    } else setEditingCell(null);
  };

  const isEditingMode = !!scheduleId; 

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-2xl font-bold mb-4">{isEditingMode ? `Edycja Grafiku: ${scheduleName}` : 'Utwórz Nowy Grafik'}</h2>
          <button onClick={() => navigate(`/schedules/${objectId}`)} style={{ padding: '5px 10px', cursor: 'pointer' }}>Anuluj / Wróć</button>
      </div>
      
      <div style={{display: 'flex', gap: '20px', marginBottom: '10px', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '5px'}}>
        <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Nazwa Grafiku:</label>
            <input 
                type="text" 
                value={scheduleName} 
                onChange={(e) => setScheduleName(e.target.value)} 
                style={{border: '1px solid #ccc', padding: '5px', width: '250px'}} 
            />
        </div>
        
        <div style={{ color: '#666' }}>
            <strong>Typ:</strong> {scheduleType === 'monthly' ? 'Miesięczny' : 'Tygodniowy'}
        </div>

        {scheduleType === 'monthly' && (
            <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Miesiąc:</label>
            <input 
                type="month" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
                disabled={isEditingMode} 
                style={{
                    border: '1px solid #ccc', padding: '5px', 
                    backgroundColor: isEditingMode ? '#e9ecef' : 'white',
                    cursor: isEditingMode ? 'not-allowed' : 'text'
                }} 
            />
            {isEditingMode && <span style={{fontSize: '10px', color: '#dc3545', display: 'block'}}>Data zablokowana w edycji</span>}
            </div>
        )}
        
        {scheduleType === 'weekly' && (
            <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Start (Pn):</label>
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                disabled={isEditingMode} 
                style={{
                    border: '1px solid #ccc', padding: '5px',
                    backgroundColor: isEditingMode ? '#e9ecef' : 'white',
                    cursor: isEditingMode ? 'not-allowed' : 'text'
                }} 
            />
            {isEditingMode && <span style={{fontSize: '10px', color: '#dc3545', display: 'block'}}>Data zablokowana w edycji</span>}
            </div>
        )}
      </div>

      <h3 className="font-bold mt-4 mb-2">Wybór Pracowników</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: '#fff', marginBottom: '20px' }}>
        {Object.entries(getEmployeesByDept()).map(([deptName, empsInDept]) => {
            const empIds = empsInDept.map(e => e.id);
            const isAllSelected = empIds.every(id => selectedEmployees.includes(id));
            
            return (
                <div key={deptName} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#e9ecef', padding: '5px', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '13px', flex: 1 }}>{deptName}</strong>
                        <button 
                            onClick={() => toggleDepartment(deptName, empIds)}
                            style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer', border: '1px solid #aaa', background: 'white', borderRadius: '4px' }}
                        >
                            {isAllSelected ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '5px' }}>
                        {empsInDept.map(emp => (
                            <label key={emp.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedEmployees.includes(emp.id)}
                                    onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id])}
                                    style={{ marginRight: '5px' }}
                                /> {emp.name}
                            </label>
                        ))}
                    </div>
                </div>
            );
        })}
        {employees.length === 0 && <p style={{color: '#888'}}>Brak pracowników.</p>}
      </div>

      {!scheduleId && (
          <button onClick={generateScheduleGrid} style={{ marginBottom: '15px', padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Załaduj Siatkę
          </button>
      )}

      {scheduleGrid.length > 0 && (
        <div style={{ marginTop: '0', overflowX: 'auto' }}>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr>
                <th style={{ width: '150px', background: '#343a40', color: 'white', position: 'sticky', left: 0, zIndex: 2, padding: '10px' }}>Pracownik</th>
                {scheduleGrid.map((day, index) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const dayName = day.toLocaleDateString('pl-PL', { weekday: 'short' });
                    const isSunday = day.getDay() === 0;
                    const staffCount = getStaffCountForDay(dateStr);
                    const isStaffComplete = staffCount >= minEmployees;
                    const blocked = isDayBlocked(day);

                    let headerBg = '#f8f9fa';
                    if (blocked) headerBg = '#e2e6ea';
                    else if (isStaffComplete) headerBg = '#d4edda';
                    else headerBg = '#f8d7da';
                    
                    return (
                        <th key={index} style={{ 
                            backgroundColor: headerBg,
                            color: blocked ? '#aaa' : 'black',
                            width: '45px', padding: '5px', textAlign: 'center',
                            borderBottom: isSunday ? '3px solid #666' : '1px solid #ccc'
                        }}>
                          <div style={{fontWeight: 'bold'}}>{day.getDate()}</div>
                          <div style={{fontSize: '10px', textTransform: 'uppercase'}}>{dayName}</div>
                          {!blocked && (
                              <div style={{fontSize: '9px', marginTop: '2px', color: isStaffComplete ? 'green' : 'red', fontWeight: 'bold'}}>
                                  {staffCount}/{minEmployees}
                              </div>
                          )}
                        </th>
                    );
                })}
                <th style={{ width: '60px', background: '#343a40', color: 'white', position: 'sticky', right: 0, zIndex: 2 }}>SUMA</th>
              </tr>
            </thead>
            <tbody>
              {selectedEmployees.map(empId => {
                const employee = employees.find(e => e.id === empId);
                const totalHours = calculateTotalHours(empId);
                return (
                  <tr key={empId}>
                    <td style={{ padding: '8px', fontWeight: 'bold', background: 'white', position: 'sticky', left: 0, zIndex: 1, borderRight: '2px solid #ddd' }}>
                        {employee?.name}
                    </td>
                    {scheduleGrid.map((day, index) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const isHoliday = holidays.includes(dateStr);
                      const isSunday = day.getDay() === 0;
                      const blocked = isDayBlocked(day);
                      const shiftValue = scheduleData[`${empId}_${dateStr}`] || "";
                      const isEditing = editingCell?.empId === empId && editingCell?.dateStr === dateStr && !blocked;
                      const details = getShiftDetails(shiftValue);
                      const isEmpty = shiftValue.trim() === "";
                      const isFormatValid = isEmpty || details !== null;
                      const violations = validateLaborCode(empId, dateStr, shiftValue);
                      const hasKPViolation = violations.length > 0;

                      let bg = 'white';
                      if (blocked) {
                          bg = '#e9ecef';
                      } else {
                          if (isHoliday) bg = '#fff0f0';
                          else if (isSunday) bg = '#fbfbfb'; 
                          
                          if (!isEmpty) {
                              if (!isFormatValid) bg = '#f8d7da';
                              else if (hasKPViolation) bg = '#fff3cd';
                              else bg = '#d1e7dd';
                          }
                      }
                      const cellTitle = blocked ? "Dzień wolny" : (hasKPViolation ? violations.join('\n') : "");

                      return (
                        <td 
                            key={index} 
                            onClick={() => !blocked && !isEditing && startEditing(empId, dateStr)}
                            title={cellTitle}
                            style={{ 
                                backgroundColor: bg, height: '35px', padding: 0, border: '1px solid #dee2e6', cursor: blocked ? 'not-allowed' : 'pointer', position: 'relative'
                            }}
                        >
                            {isEditing ? (
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={shiftValue}
                                    onChange={(e) => handleInputChange(e, empId, dateStr)}
                                    onBlur={() => saveChange(empId, dateStr)}
                                    onKeyDown={(e) => handleKeyDown(e, empId, dateStr)}
                                    style={{
                                        width: '100%', height: '100%', 
                                        border: hasKPViolation ? '2px solid orange' : '2px solid #007bff',
                                        textAlign: 'center', margin: 0, boxSizing: 'border-box',
                                        backgroundColor: hasKPViolation ? '#fff3cd' : 'white',
                                        outline: 'none', fontWeight: 'bold'
                                    }}
                                />
                            ) : (
                                <div style={{ 
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: blocked ? '#aaa' : (hasKPViolation ? '#856404' : (isFormatValid ? 'black' : 'red')),
                                    fontWeight: shiftValue ? 'bold' : 'normal',
                                    fontSize: '12px'
                                }}>
                                    {shiftValue}
                                </div>
                            )}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 'bold', textAlign: 'center', background: '#f8f9fa', position: 'sticky', right: 0, zIndex: 1, borderLeft: '2px solid #343a40' }}>
                        {totalHours}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rawTemplates.length > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Legenda skrótów (zdefiniowane w preferencjach):</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {rawTemplates.map((t, index) => (
                          <div key={index} style={{ fontSize: '12px', background: '#f8f9fa', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '3px' }}>
                              <span style={{fontWeight: 'bold', color: '#007bff'}}>{t.abbreviation}</span>: {t.start_time} - {t.end_time}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div style={{ marginTop: '30px', textAlign: 'right', paddingBottom: '50px' }}>
              <button 
                onClick={handleFinalSave}
                style={{
                    padding: '12px 30px', 
                    fontSize: '16px', fontWeight: 'bold',
                    color: 'white', backgroundColor: '#28a745', 
                    border: 'none', borderRadius: '5px', cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                  ✅ {scheduleId ? 'Zapisz Zmiany w Grafiku' : 'Utwórz i Zapisz Grafik'}
              </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default CreateSchedule;