import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Animated Logo Loader */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <span className="text-2xl font-bold text-white">WZ</span>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl opacity-60 animate-ping"></div>
          </div>
          
          {/* Enhanced Loading Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full mx-auto"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          
          {/* Loading Text */}
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              WorkZen HRMS
            </h3>
            <p className="text-sm text-gray-600 animate-pulse">
              Securing your workspace...
            </p>
          </div>
          
          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${dot * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/" replace />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Enhanced unauthorized access handling
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Unauthorized Icon */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚫</span>
            </div>
            <div className="absolute -inset-2 bg-amber-200 rounded-3xl opacity-30 animate-pulse"></div>
          </div>
          
          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            You don't have the required permissions to access this page. 
            Your role <span className="font-semibold text-indigo-600 capitalize">{user.role}</span> doesn't match the required access level.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Go to Dashboard
            </button>
          </div>
          
          {/* Support Text */}
          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {children}
    </div>
  );
};

export default ProtectedRoute;