import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    leave_type: '',
    reason: '',
  });
  const [approvingLeave, setApprovingLeave] = useState(null);

  useEffect(() => {
    fetchLeaves();
    fetchLeaveTypes();
  }, [user]);

  const fetchLeaves = async () => {
    try {
      let response;
      if (user?.role === 'employee') {
        response = await api.get(`/leave/my?search=${searchTerm}`);
      } else {
        response = await api.get(`/leave/all?search=${searchTerm}`);
      }
      setLeaves(response.data.leaves);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get('/leave/types/list');
      setLeaveTypes(response.data.leaveTypes);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLeaves();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      // Basic date order check
      const from = new Date(formData.from_date);
      const to = new Date(formData.to_date);
      if (!formData.from_date || !formData.to_date) {
        toast.error('Please select both From and To dates');
        return;
      }
      if (from > to) {
        toast.error('From date cannot be after To date');
        return;
      }

      // Overlap check against existing leaves (pending/approved)
      const myLeaves = user?.role === 'employee' ? leaves : [];
      const conflicts = myLeaves.filter(l => ['pending','approved'].includes(l.status))
        .filter(l => {
          const lFrom = new Date(l.from_date);
          const lTo = new Date(l.to_date);
          return !(to < lFrom || from > lTo);
        });
      if (conflicts.length > 0) {
        const msg = `Overlaps with existing leave: ${new Date(conflicts[0].from_date).toLocaleDateString()} - ${new Date(conflicts[0].to_date).toLocaleDateString()} (${conflicts[0].status})`;
        toast.error(msg);
        return;
      }
      await api.post('/leave/apply', formData);
      toast.success('Leave applied successfully');
      setShowApplyModal(false);
      setFormData({
        from_date: '',
        to_date: '',
        leave_type: '',
        reason: '',
      });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    }
  };

  const handleApprove = async (leaveId, paidStatus) => {
    try {
      await api.put(`/leave/${leaveId}/approve`, { paid_status: paidStatus });
      toast.success('Leave approved successfully');
      setApprovingLeave(null);
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    if (!window.confirm('Are you sure you want to reject this leave?')) return;
    try {
      await api.put(`/leave/${leaveId}/reject`);
      toast.success('Leave rejected successfully');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
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
        <h1 className="text-2xl font-bold">Leaves</h1>
        {user?.role === 'employee' && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Apply for Leave
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {user?.role !== 'employee' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Status</th>
              )}
              {user?.role === 'employee' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              )}
              {(user?.role === 'admin' || user?.role === 'hr') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaves.map((leave) => (
              <tr key={leave.id}>
                {user?.role !== 'employee' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leave.employee_name || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(leave.applied_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(leave.from_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(leave.to_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.leave_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {leave.status}
                  </span>
                </td>
                {user?.role !== 'employee' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {leave.paid_status || 'N/A'}
                  </td>
                )}
                {user?.role === 'employee' && (
                  <td className="px-6 py-4 text-sm text-gray-500">{leave.reason || 'N/A'}</td>
                )}
                {(user?.role === 'admin' || user?.role === 'hr') && leave.status === 'pending' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setApprovingLeave(leave)}
                      className="text-green-600 hover:text-green-900 mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Apply for Leave</h3>
            <form onSubmit={handleApplyLeave}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  required
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">From Date</label>
                <input
                  type="date"
                  required
                  value={formData.from_date}
                  onChange={(e) => {
                    const newFrom = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      from_date: newFrom,
                      to_date: prev.to_date && prev.to_date < newFrom ? newFrom : prev.to_date,
                    }));
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">To Date</label>
                <input
                  type="date"
                  required
                  value={formData.to_date}
                  onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                  min={formData.from_date || undefined}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {approvingLeave && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Approve Leave</h3>
            <p className="mb-4">Employee: {approvingLeave.employee_name}</p>
            <p className="mb-4">Leave Type: {approvingLeave.leave_type}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paid Status</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paid_status"
                    value="paid"
                    defaultChecked
                    className="mr-2"
                  />
                  Paid
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paid_status"
                    value="unpaid"
                    className="mr-2"
                  />
                  Unpaid
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setApprovingLeave(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const paidStatus = document.querySelector('input[name="paid_status"]:checked').value;
                  handleApprove(approvingLeave.id, paidStatus);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;

