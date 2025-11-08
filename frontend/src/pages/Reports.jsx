import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter employee name or ID');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/reports/search?name=${searchTerm}`);
      setReportData(response.data.employee);
    } catch (error) {
      toast.error('Employee not found');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (employeeId) => {
    try {
      const response = await api.get(`/reports/download/${employeeId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${employeeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadExcel = async (employeeId) => {
    try {
      const response = await api.get(`/reports/download/${employeeId}/excel`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${employeeId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download Excel');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Employee Report</h2>
            <div className="space-x-2">
              <button
                onClick={() => handleDownloadPDF(reportData.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Download PDF
              </button>
              <button
                onClick={() => handleDownloadExcel(reportData.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Download Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Employee Information</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {reportData.name}</p>
                <p><strong>Email:</strong> {reportData.email}</p>
                <p><strong>Role:</strong> {reportData.role}</p>
                <p><strong>Department:</strong> {reportData.department || 'N/A'}</p>
                <p><strong>Base Salary:</strong> ₹{reportData.base_salary}</p>
                <p><strong>HR Assigned:</strong> {reportData.hr_assigned_name || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Yearly Summary</h3>
              <div className="space-y-2">
                <p><strong>Total Salary:</strong> ₹{reportData.yearlySummary?.total_salary || 0}</p>
                <p><strong>Net Salary:</strong> ₹{reportData.yearlySummary?.total_net_salary || 0}</p>
                <p><strong>PF Deduction:</strong> ₹{reportData.yearlySummary?.total_pf || 0}</p>
                <p><strong>Professional Tax:</strong> ₹{reportData.yearlySummary?.total_tax || 0}</p>
                <p><strong>Unpaid Leave Days:</strong> {reportData.yearlySummary?.total_unpaid_days || 0}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Leave Statistics</h3>
              <div className="space-y-2">
                <p><strong>Paid Leaves:</strong> {reportData.leaveStats?.paid_leaves_count || 0}</p>
                <p><strong>Unpaid Leaves:</strong> {reportData.leaveStats?.unpaid_leaves_count || 0}</p>
                <p><strong>Approved Leaves:</strong> {reportData.leaveStats?.approved_leaves || 0}</p>
                <p><strong>Rejected Leaves:</strong> {reportData.leaveStats?.rejected_leaves || 0}</p>
                <p><strong>Pending Leaves:</strong> {reportData.leaveStats?.pending_leaves || 0}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Attendance Statistics</h3>
              <div className="space-y-2">
                <p><strong>Present Days:</strong> {reportData.attendanceStats?.present_days || 0}</p>
                <p><strong>Absent Days:</strong> {reportData.attendanceStats?.absent_days || 0}</p>
                <p><strong>Leave Days:</strong> {reportData.attendanceStats?.leave_days || 0}</p>
                <p><strong>Total Days:</strong> {reportData.attendanceStats?.total_days || 0}</p>
              </div>
            </div>
          </div>

          {reportData.payroll && reportData.payroll.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Payroll History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.payroll.map((item) => (
                      <tr key={`${item.month}-${item.year}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.basic_salary}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.net_salary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

