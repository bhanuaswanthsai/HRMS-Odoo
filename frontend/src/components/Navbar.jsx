import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ...(user?.role === 'admin' ? [{ path: '/users', label: 'Users', icon: '👥' }] : []),
    ...(user?.role === 'admin' || user?.role === 'hr' ? [{ path: '/create-employee', label: 'Create Employee', icon: '➕' }] : []),
    { path: '/attendance', label: 'Attendance', icon: '⏰' },
    { path: '/leaves', label: 'Leaves', icon: '🏖️' },
    { path: '/payroll', label: 'Payroll', icon: '💰' },
    ...(user?.role === 'admin' || user?.role === 'payroll' ? [{ path: '/reports', label: 'Reports', icon: '📈' }] : []),
    { path: '/profile', label: 'Settings', icon: '⚙️' },
  ];

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="relative bg-gray-900 border-b border-gray-700 shadow-2xl">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 opacity-95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/50 via-transparent to-transparent"></div>
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    WZ
                  </span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                WorkZen
                <span className="text-sm font-normal text-gray-400 ml-2">HRMS</span>
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                      ${isActive 
                        ? 'text-white bg-slate-800 border border-slate-600 shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-800/50'
                      }
                      group
                    `}
                  >
                    <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{link.icon}</span>
                    <span className="relative">
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 rounded-full"></span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3" ref={dropdownRef}>
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-300 group">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.5 1 1 0 00-1.14-1.14 7.97 7.97 0 006.24 9.94z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></div>
              </div>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-300 group border border-transparent hover:border-slate-600"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 font-semibold text-gray-300 border border-slate-500">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-gray-900"></div>
                </div>
                
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
                
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-600 py-2 z-50 animate-in fade-in-0 zoom-in-95">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-600/50">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-slate-700/50 transition-all duration-200 group border-b border-slate-600/30"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center group-hover:bg-slate-600 transition-colors duration-200">
                      <span className="text-gray-400">👤</span>
                    </div>
                    <span>My Profile</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-red-900/20 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center group-hover:bg-red-800/40 transition-colors duration-200">
                      <span className="text-red-400">🚪</span>
                    </div>
                    <span className="text-red-400">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-slate-700 pt-3 pb-2">
          <div className="flex overflow-x-auto space-x-2 scrollbar-hide pb-1">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 border border-transparent
                    ${isActive 
                      ? 'text-white bg-slate-800 border-slate-600 shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600'
                    }
                  `}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;