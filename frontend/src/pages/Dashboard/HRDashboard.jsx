import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const HRDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    teamSize: 0,
    pendingLeaves: 0,
    attendanceRate: 0,
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned employees
      const employeesResponse = await api.get('/users/assigned/mine');
      const myEmployees = employeesResponse.data.employees || [];
      
      // Fetch pending leaves (already filtered by backend for HR)
      const leavesResponse = await api.get('/leave/pending');
      const pendingLeaves = leavesResponse.data.leaves || [];

      // Fetch attendance summary
      const attendanceResponse = await api.get('/attendance/summary/all');
      const attendanceData = attendanceResponse.data.summary.filter(a => myEmployees.some(e => e.id === a.id));

      // Calculate department breakdown
      const deptCount = {};
      myEmployees.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
      });
      setDepartmentData(Object.entries(deptCount).map(([name, value]) => ({ name, value })));

      // Calculate attendance rate
      const totalDays = attendanceData.reduce((sum, a) => sum + parseInt(a.total_days || 0), 0);
      const presentDays = attendanceData.reduce((sum, a) => sum + parseInt(a.present_days || 0), 0);
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      setStats({
        teamSize: myEmployees.length,
        pendingLeaves: pendingLeaves.length,
        attendanceRate: attendanceRate.toFixed(1),
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
      <h1 className="text-2xl font-bold mb-6">HR Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Team Size</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.teamSize}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Leaves</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingLeaves}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Attendance Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.attendanceRate}%</p>
        </div>
      </div>

      {/* Department Breakdown Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Team by Department</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HRDashboard;

