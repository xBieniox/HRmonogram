import React, { useState, useEffect } from 'react';
import UserDetails from './UserDetails';

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

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

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
      setHighlightedIndex(-1); // Resetuj zaznaczenie po odświeżeniu
    } catch (error) {
      console.error('Error fetching employees:', error);
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
    if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => Math.min(prev + 1, employees.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      setSelectedUser(employees[highlightedIndex].id);
    }
  };

  const handleRowClick = (index) => {
    setSelectedUser(employees[index].id);
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      <h2>Employees</h2>
      {selectedUser ? (
        <UserDetails
          userId={selectedUser}
          token={token}
          onBack={() => setSelectedUser(null)}
        />
      ) : (
        <>
          <div>
            <label>
              <input
                type="checkbox"
                name="noObject"
                checked={filters.noObject}
                onChange={handleFilterChange}
              />
              No Object
            </label>
            <label>
              <input
                type="checkbox"
                name="noDepartment"
                checked={filters.noDepartment}
                onChange={handleFilterChange}
              />
              No Department
            </label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
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
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Email</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Role</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Object ID</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Department ID</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Contract Type</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  onClick={() => handleRowClick(index)}
                  style={{
                    backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ border: '1px solid black', padding: '8px' }}>{emp.name}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{emp.email}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{emp.role}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    {emp.object_id || 'None'}
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    {emp.department_id || 'None'}
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    {emp.contract_type || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {filters.page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
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
