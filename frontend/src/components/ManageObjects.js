import React, { useState, useEffect } from 'react';

const ManageObjects = ({ token }) => {
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objectName, setObjectName] = useState('');
  const [objectLocation, setObjectLocation] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/objects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setObjects(data);
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };

  const fetchDepartments = async (objectId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployeesForObject = async (objectId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEmployeesForDepartment = async (objectId, departmentId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/objects/${objectId}/departments/${departmentId}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees for department:', error);
    }
  };

  const handleCreateObject = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://127.0.0.1:5000/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: objectName, location: objectLocation }),
      });
      fetchObjects();
      setObjectName('');
      setObjectLocation('');
    } catch (error) {
      console.error('Error creating object:', error);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!selectedObject) return;
    try {
      await fetch(`http://127.0.0.1:5000/objects/${selectedObject.id}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: departmentName }),
      });
      fetchDepartments(selectedObject.id);
      setDepartmentName('');
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const handleDeleteObject = async (id) => {
    try {
      await fetch(`http://127.0.0.1:5000/objects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchObjects();
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      await fetch(`http://127.0.0.1:5000/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedObject) fetchDepartments(selectedObject.id);
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  return (
    <div>
      <h2>Manage Objects</h2>
      {!selectedObject ? (
        <>
          <form onSubmit={handleCreateObject}>
            <div>
              <label>Name:</label>
              <input
                type="text"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Location:</label>
              <input
                type="text"
                value={objectLocation}
                onChange={(e) => setObjectLocation(e.target.value)}
              />
            </div>
            <button type="submit">Create Object</button>
          </form>
          <h3>Existing Objects</h3>
          <ul>
            {objects.map((obj) => (
              <li key={obj.id}>
                <span
                  onClick={() => {
                    setSelectedObject(obj);
                    fetchDepartments(obj.id);
                    fetchEmployeesForObject(obj.id);
                  }}
                >
                  {obj.name} ({obj.location || 'No location'})
                </span>
                <button onClick={() => handleDeleteObject(obj.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h3>Departments in {selectedObject.name}</h3>
          <button onClick={() => setSelectedObject(null)}>Back to Objects</button>
          <form onSubmit={handleCreateDepartment}>
            <div>
              <label>Department Name:</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
              />
            </div>
            <button type="submit">Add Department</button>
          </form>
          <ul>
            {departments.map((dep) => (
              <li key={dep.id}>
                <span
                  onClick={() => fetchEmployeesForDepartment(selectedObject.id, dep.id)}
                >
                  {dep.name}
                </span>
                <button onClick={() => handleDeleteDepartment(dep.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <h3>Employees</h3>
          <ul>
            {employees.map((emp) => (
              <li key={emp.id}>
                {emp.name} ({emp.email}) - Role: {emp.role}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ManageObjects;
