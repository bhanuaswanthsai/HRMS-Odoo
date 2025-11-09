import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hrOfficers, setHrOfficers] = useState([]);
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo: null,
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'employee',
    department: '',
    base_salary: '',
    hr_assigned_id: '',
    year_of_joining: new Date().getFullYear(),
  });
  const [createdUser, setCreatedUser] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    // Check if user is Admin
    if (!user || user.role !== 'admin') {
      toast.error('Access denied. Only Admin can create employees.');
      navigate('/dashboard');
      return;
    }

    // Auto-populate company name from logged-in user
    if (user.company_name) {
      setFormData(prev => ({
        ...prev,
        company_name: user.company_name
      }));
    }

    // Fetch HR officers for dropdown
    if (user.role === 'admin') {
      fetchHROfficers();
    }
  }, [user, navigate]);

  const fetchHROfficers = async () => {
    try {
      const response = await api.get('/users/list/hr');
      setHrOfficers(response.data.hrOfficers || []);
    } catch (error) {
      console.error('Error fetching HR officers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 1MB to prevent request entity too large errors)
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Image size should be less than 1MB. Please compress the image.');
        return;
      }

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        // Check base64 size (should be less than ~500KB to avoid request entity too large)
        if (base64.length > 500000) {
          toast.error('Image is too large after encoding. Please use a smaller image or compress it.');
          return;
        }
        setFormData((prev) => ({
          ...prev,
          company_logo: base64,
        }));
        setLogoPreview(base64);
      };
      reader.onerror = () => {
        toast.error('Error reading image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.role) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
        hr_assigned_id: formData.hr_assigned_id || null,
        year_of_joining: parseInt(formData.year_of_joining) || new Date().getFullYear(),
      };

      const response = await api.post('/users', payload);

      if (response.data.success) {
        setCreatedUser({
          company_name: response.data.company_name,
          loginId: response.data.loginId,
          password: response.data.systemPassword,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`,
        });
        toast.success('Employee created successfully!');
        // Reset form
        setFormData({
          company_name: '',
          company_logo: null,
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          role: 'employee',
          department: '',
          base_salary: '',
          hr_assigned_id: '',
          year_of_joining: new Date().getFullYear(),
        });
        setLogoPreview(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  if (createdUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Created Successfully!</h2>
            <p className="text-gray-600 mb-6">Tell your employee to check their email for login details</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Name:</label>
              <p className="text-gray-900 font-semibold">{createdUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email:</label>
              <p className="text-gray-900 font-semibold">{createdUser.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Login ID:</label>
              <p className="text-gray-900 font-semibold font-mono">{createdUser.loginId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Temporary Password:</label>
              <p className="text-gray-900 font-semibold font-mono">{createdUser.password}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The employee must change their password on first login.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setCreatedUser(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          {/* HRMS Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold">
              HRMS
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            Create New Employee
          </h2>
          <p className="text-center text-sm text-gray-600 mb-8">
            Fill in the details to create a new employee account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                  <p className="mt-1 text-xs text-gray-500">Company name is pre-filled from your account, but you can modify it</p>
                </div>

                <div>
                  <label htmlFor="company_logo" className="block text-sm font-medium text-gray-700">
                    Company Logo (Optional)
                  </label>
                  <input
                    type="file"
                    id="company_logo"
                    name="company_logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain border rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Officer</option>
                    <option value="payroll">Payroll Officer</option>
                    {user?.role === 'admin' && <option value="admin">Admin</option>}
                  </select>
                </div>

                <div>
                  <label htmlFor="year_of_joining" className="block text-sm font-medium text-gray-700">
                    Year of Joining
                  </label>
                  <input
                    type="number"
                    id="year_of_joining"
                    name="year_of_joining"
                    value={formData.year_of_joining}
                    onChange={handleInputChange}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Department"
                  />
                </div>

                <div>
                  <label htmlFor="base_salary" className="block text-sm font-medium text-gray-700">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    id="base_salary"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {user?.role === 'admin' && (
                  <div>
                    <label htmlFor="hr_assigned_id" className="block text-sm font-medium text-gray-700">
                      Assign HR Officer
                    </label>
                    <select
                      id="hr_assigned_id"
                      name="hr_assigned_id"
                      value={formData.hr_assigned_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {hrOfficers.map((hr) => (
                        <option key={hr.id} value={hr.id}>
                          {hr.name} ({hr.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The system will automatically generate a Login ID and temporary password for the employee. 
                The employee will be required to change their password on first login.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployee;

