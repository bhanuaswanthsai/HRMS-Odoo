import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markFormData, setMarkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in_time: '',
    check_out_time: '',
  });
  const [editingAttendance, setEditingAttendance] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const fetchAttendance = async () => {
    try {
      if (user?.role === 'employee') {
        // Employee views their own attendance
        const response = await api.get(`/attendance?search=${searchTerm}`);
        setAttendance(response.data.attendance || []);
      } else if (user?.role === 'hr') {
        // HR: Get assigned employees, then fetch attendance for each
        const employeesResponse = await api.get('/users/assigned/mine');
        const employees = employeesResponse.data.employees || [];
        
        const allAttendance = [];
        for (const emp of employees) {
          try {
            const attResponse = await api.get(`/attendance/${emp.id}?search=${searchTerm}`);
            allAttendance.push(...(attResponse.data.attendance || []));
          } catch (err) {
            continue;
          }
        }
        setAttendance(allAttendance);
      } else if (user?.role === 'admin') {
        // Admin: Get all users, then fetch attendance
        const usersResponse = await api.get('/users');
        const employees = usersResponse.data.users.filter(u => u.role === 'employee');
        
        const allAttendance = [];
        for (const emp of employees.slice(0, 50)) { // Limit for performance
          try {
            const attResponse = await api.get(`/attendance/${emp.id}?search=${searchTerm}`);
            allAttendance.push(...(attResponse.data.attendance || []));
          } catch (err) {
            continue;
          }
        }
        setAttendance(allAttendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAttendance();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/mark', markFormData);
      toast.success('Attendance marked successfully');
      setShowMarkModal(false);
      setMarkFormData({
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        check_in_time: '',
        check_out_time: '',
      });
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleEditAttendance = async (id, data) => {
    try {
      await api.put(`/attendance/${id}`, data);
      toast.success('Attendance updated successfully');
      setEditingAttendance(null);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to update attendance');
    }
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
        <h1 className="text-2xl font-bold">Attendance</h1>
        {user?.role === 'employee' && (
          <button
            onClick={() => setShowMarkModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Mark Attendance
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={user?.role === 'employee' ? 'Search by date...' : 'Search by employee name or date...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {user?.role !== 'employee' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out Time</th>
              {(user?.role === 'admin' || user?.role === 'hr') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.map((record) => (
              <tr key={record.id}>
                {user?.role !== 'employee' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.employee_name || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'absent' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.check_in_time || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.check_out_time || 'N/A'}
                </td>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingAttendance(record)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMarkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Mark Attendance</h3>
            <form onSubmit={handleMarkAttendance}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={markFormData.date}
                  onChange={(e) => setMarkFormData({ ...markFormData, date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  required
                  value={markFormData.status}
                  onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                <input
                  type="time"
                  value={markFormData.check_in_time}
                  onChange={(e) => setMarkFormData({ ...markFormData, check_in_time: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                <input
                  type="time"
                  value={markFormData.check_out_time}
                  onChange={(e) => setMarkFormData({ ...markFormData, check_out_time: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Mark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

