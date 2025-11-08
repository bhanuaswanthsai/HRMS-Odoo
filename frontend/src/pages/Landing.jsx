import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold shadow-2xl">
              HRMS
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to WorkZen HRMS
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Manage your human resources with ease and efficiency
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Employee Management</h3>
              <p className="text-gray-600">Efficiently manage your workforce</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
              <p className="text-gray-600">Track attendance and leaves</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Payroll Management</h3>
              <p className="text-gray-600">Automated payroll processing</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            <Link
              to="/login"
              className="block w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Sign In
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-500">
                  New to WorkZen?
                </span>
              </div>
            </div>

            <Link
              to="/company-signup"
              className="block w-full bg-white text-blue-600 py-4 px-6 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
            >
              Sign Up as Company
            </Link>

            <p className="text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

