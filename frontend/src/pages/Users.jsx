import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [imageUrls, setImageUrls] = useState({}); // userId -> object URL
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
    // Only fetch HR officers if user is admin (for dropdown)
    if (currentUser?.role === 'admin') {
      fetchHROfficers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/users?search=${searchTerm}`);
      const list = response.data.users || [];
      setUsers(list);
      // Load avatars for users with profile images
      await loadAvatars(list);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Load avatars into object URLs and cache per user ID
  const loadAvatars = async (list) => {
    const promises = list
      .filter((u) => u.has_profile_image)
      .map(async (u) => {
        try {
          const res = await api.get(`/users/profile/image/${u.id}`, { responseType: 'blob' });
          const url = URL.createObjectURL(res.data);
          setImageUrls((prev) => {
            // Revoke previous URL for this user if exists
            const existing = prev[u.id];
            if (existing) {
              try { URL.revokeObjectURL(existing); } catch (_) {}
            }
            return { ...prev, [u.id]: url };
          });
        } catch (_) {
          // ignore failures; fallback to initials
        }
      });
    await Promise.all(promises);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
    };
  }, []);

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
        const response = await api.post('/users', submitData);
        if (response.data.generatedPassword) {
          toast.success(`User created successfully! Generated Password: ${response.data.generatedPassword}`, { duration: 10000 });
        } else {
          toast.success('User created successfully');
        }
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

  const isEmployee = currentUser?.role === 'employee';
  const isAdmin = currentUser?.role === 'admin';
  const isHR = currentUser?.role === 'hr';
  const canEdit = isAdmin || isHR;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEmployee ? 'Employees' : 'User Management'}</h1>
        {isAdmin && (
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
        )}
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

      {isEmployee ? (
        // Card Grid View for Employees (Read-Only)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow relative"
            >
              {/* Status Indicator Button */}
              {user.today_status && (
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      user.today_status === 'present'
                        ? 'bg-green-500'
                        : user.today_status === 'absent'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                    title={`Today's Status: ${user.today_status}`}
                  />
                </div>
              )}
              <div className="flex items-center justify-center mb-4">
                {imageUrls[user.id] ? (
                  <img
                    src={imageUrls[user.id]}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Department:</span> {user.department || 'N/A'}
                </p>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No employees found
            </div>
          )}
        </div>
      ) : (
        // Table View for Admin/HR (with Edit/Delete)
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
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {imageUrls[user.id] ? (
                        <img
                          src={imageUrls[user.id]}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        {user.today_status && user.role === 'employee' && (
                          <div
                            className={`ml-2 w-3 h-3 rounded-full ${
                              user.today_status === 'present'
                                ? 'bg-green-500'
                                : user.today_status === 'absent'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                            title={`Today's Status: ${user.today_status}`}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
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
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && !isEmployee && (
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
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-gray-500 text-xs">(Leave empty to auto-generate)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Auto-generated if left empty"
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

