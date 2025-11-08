import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hrOfficers, setHrOfficers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    base_salary: '',
    hr_assigned_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchHROfficers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/users?search=${searchTerm}`);
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchHROfficers = async () => {
    try {
      const response = await api.get('/users/list/hr');
      setHrOfficers(response.data.hrOfficers || []);
      console.log('HR Officers fetched:', response.data.hrOfficers);
    } catch (error) {
      console.error('Error fetching HR officers:', error);
      toast.error('Failed to fetch HR officers');
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // For editing, prepare update data - always send all fields
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
          status: formData.status || 'active',
        };
        
        // Handle hr_assigned_id - only for employee role, convert empty string to null
        if (formData.role === 'employee') {
          updateData.hr_assigned_id = (formData.hr_assigned_id && formData.hr_assigned_id !== '') 
            ? parseInt(formData.hr_assigned_id) 
            : null;
        } else {
          // For non-employee roles, set to null
          updateData.hr_assigned_id = null;
        }

        console.log('Updating user with data:', updateData);
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // For creating new user
        const submitData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || null,
          base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
          hr_assigned_id: formData.hr_assigned_id && formData.hr_assigned_id !== '' 
            ? parseInt(formData.hr_assigned_id) 
            : null,
          status: formData.status || 'active',
        };
        await api.post('/users', submitData);
        toast.success('User created successfully');
        // Refresh HR officers list after creating a user (in case an HR was created)
        await fetchHROfficers();
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = async (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'employee',
      department: user.department || '',
      base_salary: user.base_salary || 0,
      hr_assigned_id: user.hr_assigned_id ? String(user.hr_assigned_id) : '',
      status: user.status || 'active',
    });
    // Refresh HR officers before opening edit modal (in case HR was created)
    if (user.role === 'employee') {
      await fetchHROfficers();
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      base_salary: '',
      hr_assigned_id: '',
      status: 'active',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={async () => {
            setEditingUser(null);
            resetForm();
            // Refresh HR officers list before opening modal
            await fetchHROfficers();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New User
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HR Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{user.base_salary || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.hr_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {!editingUser && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={async (e) => {
                    const newRole = e.target.value;
                    setFormData({ ...formData, role: newRole });
                    // Refresh HR officers when switching to employee role
                    if (newRole === 'employee') {
                      await fetchHROfficers();
                    }
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="hr">HR Officer</option>
                  <option value="payroll">Payroll Officer</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                <input
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {formData.role === 'employee' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">HR Assigned</label>
                  <select
                    value={formData.hr_assigned_id}
                    onChange={(e) => setFormData({ ...formData, hr_assigned_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select HR Officer</option>
                    {hrOfficers.length > 0 ? (
                      hrOfficers.map((hr) => (
                        <option key={hr.id} value={hr.id}>
                          {hr.name} ({hr.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No HR Officers available</option>
                    )}
                  </select>
                  {hrOfficers.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">Please create an HR Officer first</p>
                  )}
                </div>
              )}
              {editingUser && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

