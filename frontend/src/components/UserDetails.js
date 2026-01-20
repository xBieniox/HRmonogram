import React, { useState, useEffect } from 'react';

const UserDetails = ({ userId, token, onBack }) => {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    objectId: '',
    departmentId: '',
    contractType: '',
  });
  const [objects, setObjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserDetails();
    fetchObjects();
    fetchDepartments();
    fetchContracts();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUser(data);
      setFormData({
        name: data.name,
        email: data.email,
        objectId: data.object_id || '',
        departmentId: data.department_id || '',
        contractType: data.contract_type || '',
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      const data = await response.json();
      setNewPassword(data.new_password);
      alert('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };
  
  const fetchContracts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/contracts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          object_id: formData.objectId || null,
          department_id: formData.departmentId || null,
          contract_type: formData.contractType || null,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      alert('User updated successfully');
      fetchUserDetails();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      <button onClick={onBack}>Back</button>
      {isEditing ? (
        <div>
          <h3>Edit User</h3>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Object:</label>
            <select
              name="objectId"
              value={formData.objectId}
              onChange={handleInputChange}
            >
              <option value="">None</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Department:</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
            >
              <option value="">None</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Contract Type:</label>
            <select
              name="contractType"
              value={formData.contractType}
              onChange={handleInputChange}
            >
              <option value="">None</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.name}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h3>Details</h3>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Object:</strong> {objects.find((o) => o.id === user.object_id)?.name || 'None'}</p>
          <p><strong>Department:</strong> {departments.find((d) => d.id === user.department_id)?.name || 'None'}</p>
          <p><strong>Contract Type:</strong> {user.contract_type || 'None'}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleResetPassword}>Reset Password</button>
          {newPassword && <p>New Password: {newPassword}</p>}
        </div>
      )}
    </div>
  );
};

export default UserDetails;
