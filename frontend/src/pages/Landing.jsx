import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="mb-10">
        <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow">
          HRMS
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center">
        Welcome to WorkZen HRMS
      </h1>
      <p className="mt-3 text-gray-600 text-center max-w-xl">
        Manage your human resources with ease and efficiency
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 w-full max-w-4xl">
        <div className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold mb-1">Employee Management</h3>
          <p className="text-sm text-gray-600">Efficiently manage your workforce</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-1">Attendance Tracking</h3>
          <p className="text-sm text-gray-600">Track attendance and leaves</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">💰</div>
          <h3 className="font-semibold mb-1">Payroll Management</h3>
          <p className="text-sm text-gray-600">Automated payroll processing</p>
        </div>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="mt-10 bg-blue-600 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition"
      >
        Sign In
      </button>
    </div>
  );
};

export default Landing;
