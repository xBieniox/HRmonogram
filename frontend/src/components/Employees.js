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

  
  const containerStyle = {
      maxWidth: '1200px', margin: '0 auto', padding: '0'
  };

  const cardStyle = {
      background: 'white', padding: '20px', borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  };

  const inputStyle = {
      padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px'
  };

  const thStyle = {
      textAlign: 'left', padding: '12px 15px', 
      background: '#f8f9fa', borderBottom: '2px solid #dee2e6',
      color: '#495057', fontSize: '13px', textTransform: 'uppercase', fontWeight: '600'
  };

  const tdStyle = {
      padding: '12px 15px', borderBottom: '1px solid #e9ecef', color: '#333', fontSize: '14px'
  };

  const roleBadgeStyle = (role) => {
      let bg = '#e2e3e5';
      let color = '#383d41';
      if(role === 'admin') { bg = '#d1ecf1'; color = '#0c5460'; }
      if(role === 'global_hr') { bg = '#d4edda'; color = '#155724'; }
      if(role === 'local_hr') { bg = '#fff3cd'; color = '#856404'; }
      return {
          backgroundColor: bg, color: color, padding: '3px 8px', 
          borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'
      };
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      
      {selectedUser ? (
        // Widok Szczegółów
        <div style={containerStyle}>
             <UserDetails
                userId={selectedUser}
                token={token}
                onBack={handleBack}
                canEdit={canEdit} 
             />
        </div>
      ) : (
        // Widok Listy
        <div style={containerStyle}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>Lista Pracowników</h2>
          
          {/* SEKCJA FILTRÓW */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Wyszukiwarka */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        placeholder="🔍 Szukaj po nazwisku lub email..."
                        onChange={handleFilterChange}
                        style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Sortowanie */}
                <select 
                    name="sortBy" 
                    value={filters.sortBy} 
                    onChange={handleFilterChange}
                    style={inputStyle}
                >
                    <option value="name">Sortuj: Nazwisko</option>
                    <option value="object">Sortuj: Obiekt</option>
                    <option value="department">Sortuj: Departament</option>
                </select>

                {/* Checkboxy */}
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#555' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="noObject"
                            checked={filters.noObject}
                            onChange={handleFilterChange}
                        />
                        Tylko bez Obiektu
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="noDepartment"
                            checked={filters.noDepartment}
                            onChange={handleFilterChange}
                        />
                        Tylko bez Departamentu
                    </label>
                </div>
            </div>
          </div>

          {/* TABELA */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Imię i Nazwisko</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Rola</th>
                        <th style={thStyle}>Obiekt</th>
                        <th style={thStyle}>Departament</th>
                        <th style={thStyle}>Umowa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => (
                        <tr
                          key={emp.id}
                          onClick={() => handleRowClick(index)}
                          style={{
                            backgroundColor: highlightedIndex === index ? '#f1f3f5' : 'white',
                            cursor: canEdit ? 'pointer' : 'default', 
                            transition: 'background-color 0.1s'
                          }}
                          onMouseEnter={(e) => {
                              if(canEdit) e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                              if(canEdit) e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <td style={{ ...tdStyle, fontWeight: '600', color: canEdit ? '#007bff' : '#333' }}>
                              {emp.name}
                          </td>
                          <td style={tdStyle}>{emp.email}</td>
                          <td style={tdStyle}>
                              <span style={roleBadgeStyle(emp.role)}>{emp.role}</span>
                          </td>
                          
                          <td style={tdStyle}>
                            {emp.object_name ? (
                                <span style={{ fontWeight: '500' }}>{emp.object_name}</span>
                            ) : (
                                <span style={{ color: '#dc3545', fontSize: '12px' }}>⚠️ Brak</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {emp.department_name || <span style={{color: '#aaa'}}>-</span>}
                          </td>
                          
                          <td style={tdStyle}>
                            {emp.contract_type || <span style={{color: '#aaa'}}>-</span>}
                          </td>
                        </tr>
                      ))}
                      {employees.length === 0 && (
                          <tr>
                              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                                  Brak pracowników spełniających kryteria wyszukiwania.
                              </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
              </div>
          </div>

         
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              style={{ 
                  padding: '8px 16px', borderRadius: '4px', border: '1px solid #dee2e6',
                  backgroundColor: filters.page <= 1 ? '#e9ecef' : 'white',
                  color: filters.page <= 1 ? '#adb5bd' : '#007bff',
                  cursor: filters.page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              &larr; Poprzednia
            </button>
            <span style={{ fontSize: '14px', color: '#555' }}>
              Strona <b>{filters.page}</b> z {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              style={{ 
                  padding: '8px 16px', borderRadius: '4px', border: '1px solid #dee2e6',
                  backgroundColor: filters.page >= totalPages ? '#e9ecef' : 'white',
                  color: filters.page >= totalPages ? '#adb5bd' : '#007bff',
                  cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Następna &rarr;
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default Employees;