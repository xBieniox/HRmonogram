import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Schedules = ({ token }) => {
  const [objects, setObjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/objects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch objects');
      }
      const data = await response.json();
      setObjects(data);
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };

  const handleObjectClick = (objectId) => {
    navigate(`/schedules/${objectId}`);
  };

  return (
    <div>
      <h2>Manage Work Schedules</h2>
      <ul>
        {objects.map((object) => (
          <li key={object.id}>
            <button onClick={() => handleObjectClick(object.id)}>{object.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Schedules;
