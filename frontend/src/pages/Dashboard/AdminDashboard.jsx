import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import EmployeeCard from '../../components/EmployeeCard';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyCost: 0,
    yearlyCost: 0,
    present: 0,
    onLeave: 0,
    absent: 0,
    notCheckedIn: 0,
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmployees, setShowEmployees] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's attendance status
      const attendanceResponse = await api.get('/attendance/today/status');
      const employeeData = attendanceResponse.data.employees || [];
      setEmployees(employeeData);
      
      // Calculate attendance stats
      const attendanceStats = {
        present: employeeData.filter(e => e.attendance_status === 'present').length,
        onLeave: employeeData.filter(e => e.attendance_status === 'leave').length,
        absent: employeeData.filter(e => e.attendance_status === 'absent').length,
        notCheckedIn: employeeData.filter(e => e.attendance_status === 'not_checked_in').length,
      };
      
      // Fetch users for department stats
      const usersResponse = await api.get('/users');
      const users = usersResponse.data.users;
      const allEmployees = users.filter(u => u.role === 'employee');
      
      // Calculate department-wise count
      const deptCount = {};
      allEmployees.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
      });
      setDepartmentData(Object.entries(deptCount).map(([name, value]) => ({ name, value })));

      // Fetch payroll summary
      try {
        const payrollResponse = await api.get('/payroll/summary/dashboard');
        const payrollData = payrollResponse.data;
        
        // Calculate totals
        const monthlyTotal = payrollData.currentMonth?.total_net_salary || 0;
        const yearlyTotal = payrollData.yearly?.reduce((sum, month) => sum + parseFloat(month.total_net_salary || 0), 0) || 0;

        setStats({
          totalEmployees: allEmployees.length,
          activeEmployees: allEmployees.filter(e => e.status === 'active').length,
          monthlyCost: monthlyTotal,
          yearlyCost: yearlyTotal,
          ...attendanceStats,
        });

        // Format payroll trend data
        const trendData = payrollData.yearly?.map((month, index) => ({
          month: `Month ${month.month}`,
          amount: parseFloat(month.total_net_salary || 0),
        })) || [];
        setPayrollTrend(trendData);
      } catch (payrollError) {
        console.error('Payroll data error:', payrollError);
        // Continue without payroll data
        setStats({
          totalEmployees: allEmployees.length,
          activeEmployees: allEmployees.filter(e => e.status === 'active').length,
          monthlyCost: 0,
          yearlyCost: 0,
          ...attendanceStats,
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmployees(!showEmployees)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            {showEmployees ? 'Show Analytics' : 'Show Employees'}
          </button>
          <button
            onClick={() => navigate('/create-employee')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Employee
          </button>
        </div>
      </div>

      {showEmployees ? (
        <>
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium">Present</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.present}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium">On Leave</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.onLeave}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <h3 className="text-gray-500 text-sm font-medium">Absent</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.absent}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <h3 className="text-gray-500 text-sm font-medium">Not Checked In</h3>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.notCheckedIn}</p>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Employees</h2>
            {employees.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No employees found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Active Employees</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeEmployees}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Monthly Payroll Cost</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{stats.monthlyCost.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Yearly Payroll Cost</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">₹{stats.yearlyCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Employees by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Monthly Payroll Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

