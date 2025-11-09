import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import EmployeeCard from '../../components/EmployeeCard';

const HRDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    onLeave: 0,
    absent: 0,
    notCheckedIn: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/today/status');
      const employeeData = response.data.employees || [];
      
      setEmployees(employeeData);
      
      // Calculate stats
      const statsData = {
        total: employeeData.length,
        present: employeeData.filter(e => e.attendance_status === 'present').length,
        onLeave: employeeData.filter(e => e.attendance_status === 'leave').length,
        absent: employeeData.filter(e => e.attendance_status === 'absent').length,
        notCheckedIn: employeeData.filter(e => e.attendance_status === 'not_checked_in').length,
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employee data');
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
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
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
    </div>
  );
};

export default HRDashboard;
