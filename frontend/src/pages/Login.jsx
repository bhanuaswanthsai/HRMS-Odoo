import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordChangeModal from '../components/PasswordChangeModal';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      if (result.requiresPasswordChange) {
        // Show password change modal
        setUserForPasswordChange(result.user);
        setShowPasswordChange(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChange(false);
    setUserForPasswordChange(null);
    toast.success('Password changed successfully! Please login again.');
    // Clear form
    setIdentifier('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* HRMS Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold">
              HRMS
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            WorkZen HRMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Login ID or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Login ID or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 mt-2">
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && userForPasswordChange && (
        <PasswordChangeModal
          loginId={userForPasswordChange.login_id}
          onSuccess={handlePasswordChangeSuccess}
          onClose={() => {
            setShowPasswordChange(false);
            setUserForPasswordChange(null);
          }}
        />
      )}
    </div>
  );
};

export default Login;

