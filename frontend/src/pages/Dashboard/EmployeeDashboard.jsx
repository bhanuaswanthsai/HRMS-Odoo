import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    pendingLeaves: 0,
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [latestPayslips, setLatestPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const response = await api.get('/attendance/today/my-status');
      setCheckedIn(response.data.checkedIn || false);
      setTodayAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const response = await api.post('/attendance/checkin');
      if (response.data.success) {
        setCheckedIn(true);
        toast.success('Checked in successfully!');
        fetchTodayStatus();
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      if (!todayAttendance || !todayAttendance.id) {
        toast.error('Please check in first');
        return;
      }

      const response = await api.put(`/attendance/${todayAttendance.id}`, {
        check_out_time: currentTime
      });
      
      if (response.data.success) {
        toast.success('Checked out successfully!');
        fetchTodayStatus();
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckingOut(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      // Fetch attendance
      const attendanceResponse = await api.get(`/attendance/${userId}`);
      const attendance = attendanceResponse.data.attendance;

      // Calculate attendance stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);

      const presentDays = recentAttendance.filter(a => a.status === 'present').length;
      const absentDays = recentAttendance.filter(a => a.status === 'absent').length;
      const leaveDays = recentAttendance.filter(a => a.status === 'leave').length;

      // Format attendance data for chart (last 7 days)
      const last7Days = recentAttendance.slice(0, 7).reverse();
      setAttendanceData(last7Days.map(a => ({
        date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: a.status === 'present' ? 1 : 0,
        absent: a.status === 'absent' ? 1 : 0,
      })));

      // Fetch leaves
      const leavesResponse = await api.get('/leave/my');
      const leaves = leavesResponse.data.leaves;
      const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

      // Fetch latest payslips
      const payrollResponse = await api.get(`/payroll/${userId}`);
      const payroll = payrollResponse.data.payroll;
      setLatestPayslips(payroll.slice(0, 3));

      setStats({
        presentDays,
        absentDays,
        leaveDays,
        pendingLeaves,
      });

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
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/profile')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>👤</span>
            My Profile
          </button>
          {!checkedIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {checkingIn ? 'Checking In...' : '✓ Check In'}
            </button>
          )}
          {checkedIn && (
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Checked In {todayAttendance?.check_in_time ? `at ${todayAttendance.check_in_time}` : ''}
              </div>
              {!todayAttendance?.check_out_time && (
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {checkingOut ? 'Checking Out...' : '✗ Check Out'}
                </button>
              )}
              {todayAttendance?.check_out_time && (
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                  Checked Out at {todayAttendance.check_out_time}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Present Days (30d)</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.presentDays}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Absent Days (30d)</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.absentDays}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Leave Days (30d)</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.leaveDays}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Leaves</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingLeaves}</p>
        </div>
      </div>

      {/* Charts and Latest Payslips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Attendance (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10B981" name="Present" />
              <Bar dataKey="absent" fill="#EF4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Latest Payslips</h3>
          <div className="space-y-4">
            {latestPayslips.length > 0 ? (
              latestPayslips.map((payslip) => (
                <div key={payslip.id} className="border-b pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {payslip.month}/{payslip.year}
                      </p>
                      <p className="text-sm text-gray-500">Net Salary: ₹{payslip.net_salary}</p>
                    </div>
                    <Link
                      to={`/payroll/${payslip.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No payslips available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

