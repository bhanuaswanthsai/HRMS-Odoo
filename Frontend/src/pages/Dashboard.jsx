import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePermissions } from '../hooks/usePermissions.js';
import { dashboardService } from '../services/dashboardService.js';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = user?.role === 'admin' || user?.role === 'hr_officer'
          ? await dashboardService.getAdmin()
          : await dashboardService.getEmployee();
        
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="p-8">Failed to load dashboard</div>;
  }

  const { isAdmin } = usePermissions();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {isAdmin && (
          <Link
            to="/users"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Manage Users
          </Link>
        )}
      </div>
      
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Total Employees</h3>
            <p className="text-3xl font-bold text-indigo-600">{dashboardData.totalEmployees}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Active Employees</h3>
            <p className="text-3xl font-bold text-green-600">{dashboardData.activeEmployees}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Pending Leaves</h3>
            <p className="text-3xl font-bold text-yellow-600">{dashboardData.pendingLeaves}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Attendance Rate</h3>
            <p className="text-3xl font-bold text-blue-600">{dashboardData.attendanceRate}%</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
            <div className="space-y-2">
              <p>Present Days: <span className="font-bold">{dashboardData.attendance?.presentDays}</span></p>
              <p>Absent Days: <span className="font-bold">{dashboardData.attendance?.absentDays}</span></p>
              <p>Leave Days: <span className="font-bold">{dashboardData.attendance?.leaveDays}</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
            <div className="space-y-2">
              <p>Casual Leave: <span className="font-bold">{dashboardData.leaveBalance?.casual_leave}</span></p>
              <p>Sick Leave: <span className="font-bold">{dashboardData.leaveBalance?.sick_leave}</span></p>
              <p>Earned Leave: <span className="font-bold">{dashboardData.leaveBalance?.earned_leave}</span></p>
              <p>Paid Leave: <span className="font-bold">{dashboardData.leaveBalance?.paid_leave}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

