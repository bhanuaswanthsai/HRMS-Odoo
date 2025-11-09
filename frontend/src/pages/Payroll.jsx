import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Payroll = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Check for payslip ID in URL and auto-open it
  useEffect(() => {
    const payslipId = searchParams.get('payslip');
    if (payslipId && payroll.length > 0) {
      const payslip = payroll.find(p => p.id === parseInt(payslipId));
      if (payslip) {
        setSelectedPayslip(payslip);
        // Remove the query parameter from URL
        setSearchParams({});
      }
    }
  }, [payroll, searchParams, setSearchParams]);

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

  const handleDownloadPayslipPDF = async (payslip) => {
    try {
      const userId = user?.role === 'employee' ? user.id : payslip.user_id;
      const response = await api.get(`/payroll/payslip/${payslip.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const monthName = new Date(2000, payslip.month - 1).toLocaleString('default', { month: 'long' });
      link.setAttribute('download', `payslip_${monthName}_${payslip.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error('Failed to download payslip');
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
          <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Payslip View</h3>
              <button
                onClick={() => handleDownloadPayslipPDF(selectedPayslip)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Download PDF
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="font-semibold text-gray-900">{selectedPayslip.employee_name || user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(2000, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Basic Salary</span>
                <span className="font-semibold">₹{selectedPayslip.basic_salary}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Paid Leaves</span>
                <span className="font-semibold text-green-600">{selectedPayslip.paid_leaves} days</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Unpaid Leaves</span>
                <span className="font-semibold text-red-600">{selectedPayslip.unpaid_leaves} days</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">PF Deduction (12%)</span>
                <span className="font-semibold text-red-600">-₹{selectedPayslip.pf_deduction}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Professional Tax</span>
                <span className="font-semibold text-red-600">-₹{selectedPayslip.professional_tax}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-4">
                <span className="text-lg font-bold text-gray-900">Net Salary</span>
                <span className="text-lg font-bold text-green-600">₹{selectedPayslip.net_salary}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
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

