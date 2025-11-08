import { useNavigate } from 'react-router-dom';

const EmployeeCard = ({ employee }) => {
  const navigate = useNavigate();

  // Get status indicator
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'present':
        return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
      case 'leave':
        return <span className="text-2xl">✈️</span>;
      case 'absent':
        return <div className="w-4 h-4 rounded-full bg-yellow-500"></div>;
      case 'not_checked_in':
      default:
        return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'leave':
        return 'On Leave';
      case 'absent':
        return 'Absent';
      case 'not_checked_in':
      default:
        return 'Not Checked In';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50';
      case 'leave':
        return 'text-blue-600 bg-blue-50';
      case 'absent':
        return 'text-yellow-600 bg-yellow-50';
      case 'not_checked_in':
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const handleCardClick = () => {
    navigate(`/users/${employee.id}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between">
        {/* Employee Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown'}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            {employee.department || 'No Department'}
          </p>
          <p className="text-xs text-gray-500">
            {employee.email}
          </p>
        </div>

        {/* Avatar and Status */}
        <div className="flex flex-col items-end space-y-2">
          {/* Avatar */}
          <div className="relative">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                {getInitials(employee.name || employee.first_name || employee.email)}
              </div>
            )}
            
            {/* Status Indicator */}
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 bg-white rounded-full border-2 border-white">
              {getStatusIndicator(employee.attendance_status)}
            </div>
          </div>

          {/* Status Badge */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(employee.attendance_status)}`}>
            {getStatusText(employee.attendance_status)}
          </span>
        </div>
      </div>

      {/* Check-in Time */}
      {employee.check_in_time && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Check-in: <span className="font-medium">{employee.check_in_time}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;

