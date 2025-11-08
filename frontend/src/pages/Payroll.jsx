import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Payroll = () => {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    fetchPayroll();
  }, [user]);

  const fetchPayroll = async () => {
    try {
      let response;
      if (user?.role === 'employee') {
        response = await api.get(`/payroll`);
      } else {
        response = await api.get(`/payroll/reports/all?search=${searchTerm}`);
      }
      setPayroll(response.data.payroll || []);
    } catch (error) {
      toast.error('Failed to fetch payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user?.role !== 'employee') {
        fetchPayroll();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll/generate', generateForm);
      toast.success('Payroll generated successfully');
      setShowGenerateModal(false);
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
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
        <h1 className="text-2xl font-bold">Payroll</h1>
        {(user?.role === 'admin' || user?.role === 'payroll') && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Generate Payroll
          </button>
        )}
      </div>

      {(user?.role === 'admin' || user?.role === 'payroll') && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {(user?.role === 'admin' || user?.role === 'payroll') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payroll.map((item) => (
              <tr key={item.id}>
                {(user?.role === 'admin' || user?.role === 'payroll') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.employee_name || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.month}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.basic_salary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{item.net_salary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedPayslip(item)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Generate Payroll</h3>
            <form onSubmit={handleGeneratePayroll}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <select
                  required
                  value={generateForm.month}
                  onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  required
                  value={generateForm.year}
                  onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="2020"
                  max="2100"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPayslip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Payslip View</h3>
            <div className="space-y-2">
              <p><strong>Employee:</strong> {selectedPayslip.employee_name || 'N/A'}</p>
              <p><strong>Month:</strong> {selectedPayslip.month}</p>
              <p><strong>Year:</strong> {selectedPayslip.year}</p>
              <p><strong>Basic Salary:</strong> ₹{selectedPayslip.basic_salary}</p>
              <p><strong>Paid Leaves:</strong> {selectedPayslip.paid_leaves}</p>
              <p><strong>Unpaid Leaves:</strong> {selectedPayslip.unpaid_leaves}</p>
              <p><strong>PF Deduction:</strong> ₹{selectedPayslip.pf_deduction}</p>
              <p><strong>Professional Tax:</strong> ₹{selectedPayslip.professional_tax}</p>
              <p><strong>Net Salary:</strong> ₹{selectedPayslip.net_salary}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;

