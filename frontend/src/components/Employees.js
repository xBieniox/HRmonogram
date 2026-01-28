import React, { useState, useEffect } from 'react';
import UserDetails from './UserDetails';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../authUtils';

const Employees = ({ token }) => {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    noObject: false,
    noDepartment: false,
    sortBy: 'name',
    search: '',
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const navigate = useNavigate();
  
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (token) {
      const role = getUserRole(token);
      setUserRole(role);
      
      if (role === 'employee') {
          navigate('/');
      } else {
          setAuthChecked(true);
      }
    }
  }, [token, navigate]);

  const canEdit = userRole === 'admin' || userRole === 'global_hr';

  useEffect(() => {
    if (authChecked) {
        fetchEmployees();
    }
    // eslint-disable-next-line
  }, [filters, authChecked]);


  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams({
        page: filters.page,
        per_page: 15,
        ...(filters.noObject && { no_object: true }),
        ...(filters.noDepartment && { no_department: true }),
        ...(filters.sortBy && { sort_by: filters.sortBy }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`http://127.0.0.1:5000/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data.employees);
      setTotalPages(data.pages);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleKeyDown = (e) => {
    if (!canEdit) return;

    if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => Math.min(prev + 1, employees.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      setSelectedUser(employees[highlightedIndex].id);
    }
  };

  const handleRowClick = (index) => {
    if (!canEdit) return;
    setSelectedUser(employees[index].id);
  };

  const handleBack = () => {
      setSelectedUser(null);
      fetchEmployees(); 
  };

  if (!authChecked) return null;

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>Employees</h2>
      
      {selectedUser ? (
        <UserDetails
          userId={selectedUser}
          token={token}
          onBack={handleBack}
          canEdit={canEdit} 
        />
      ) : (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                name="noObject"
                checked={filters.noObject}
                onChange={handleFilterChange}
              />
              No Object
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                name="noDepartment"
                checked={filters.noDepartment}
                onChange={handleFilterChange}
              />
              No Department
            </label>
            <select 
                name="sortBy" 
                value={filters.sortBy} 
                onChange={handleFilterChange}
                style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="name">Sort by Name</option>
              <option value="object">Sort by Object</option>
              <option value="department">Sort by Department</option>
            </select>
            <input
              type="text"
              name="search"
              value={filters.search}
              placeholder="Search by Name"
              onChange={handleFilterChange}
              style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Object</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Department</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Contract Type</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  onClick={() => handleRowClick(index)}
                  style={{
                    backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'white',
                    cursor: canEdit ? 'pointer' : 'default', 
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                      if(canEdit) e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                      if(canEdit) e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: canEdit ? '#2563eb' : 'black' }}>
                      {emp.name}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.email}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.role}</td>
                  
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {emp.object_name || <span style={{color: '#999'}}>-</span>}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {emp.department_name || <span style={{color: '#999'}}>-</span>}
                  </td>
                  
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {emp.contract_type || <span style={{color: '#999'}}>-</span>}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                  <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          Brak pracowników spełniających kryteria.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              style={{ padding: '8px 16px', cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px' }}
            >
              Previous
            </button>
            <span>
              Page {filters.page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              style={{ padding: '8px 16px', cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Employees;