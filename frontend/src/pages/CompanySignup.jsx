import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CompanySignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Company Info, 2: Admin Account
  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    company_logo: null,
    company_address: '',
    company_phone: '',
    company_email: '',
    
    // Admin Account Information
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    confirm_password: '',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [createdAccount, setCreatedAccount] = useState(null);

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
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Reduce max file size and compress if needed
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Image size should be less than 1MB. Please compress the image.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        // Compress image if it's too large (reduce quality for large images)
        if (base64.length > 500000) { // ~500KB base64 (~375KB actual)
          toast.error('Image is too large. Please use a smaller image or compress it.');
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

  const handleCompanyInfoSubmit = (e) => {
    e.preventDefault();
    
    // Validate company information
    if (!formData.company_name || !formData.company_email) {
      toast.error('Please fill in all required company fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      toast.error('Please enter a valid company email');
      return;
    }

    setStep(2);
  };

  const handleAdminAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.admin_first_name || !formData.admin_last_name || !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill in all required admin account fields');
      setLoading(false);
      return;
    }

    if (formData.admin_password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.admin_password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      toast.error('Please enter a valid admin email');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        company_name: formData.company_name,
        company_logo: formData.company_logo,
        company_address: formData.company_address || null,
        company_phone: formData.company_phone || null,
        company_email: formData.company_email,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
        admin_email: formData.admin_email,
        admin_phone: formData.admin_phone || null,
        admin_password: formData.admin_password,
      };

      const response = await api.post('/auth/register-company', payload);

      if (response.data.success) {
        setCreatedAccount({
          companyName: response.data.company_name,
          adminLoginId: response.data.admin_login_id,
          adminEmail: response.data.admin_email,
        });
        toast.success('Company registered successfully!');
      }
    } catch (error) {
      console.error('=== FRONTEND COMPANY REGISTRATION ERROR ===');
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Error registering company. Please check the console for details.';
      
      if (error.response?.status === 413 || error.message?.includes('too large') || error.response?.data?.message?.includes('too large')) {
        errorMessage = 'Request too large. Please reduce the size of your company logo (max 1MB) or try without a logo.';
      } else {
        errorMessage = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Error registering company. Please check the console for details.';
      }
      
      // Show detailed error in development
      if (process.env.NODE_ENV === 'development') {
        toast.error(`${errorMessage}${error.response?.data?.detail ? ' - ' + error.response.data.detail : ''}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (createdAccount) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Registered Successfully!</h2>
            <p className="text-gray-600 mb-6">Your company account has been created.</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name:</label>
              <p className="text-gray-900 font-semibold">{createdAccount.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Admin Email:</label>
              <p className="text-gray-900 font-semibold">{createdAccount.adminEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Admin Login ID:</label>
              <p className="text-gray-900 font-semibold font-mono">{createdAccount.adminLoginId}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> Use your Login ID and password to sign in and start managing your company.
            </p>
          </div>

          <div className="flex space-x-3">
            <Link
              to="/login"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold">
              HRMS
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            Register Your Company
          </h2>
          <p className="text-center text-sm text-gray-600 mb-8">
            {step === 1 
              ? 'Step 1 of 2: Company Information'
              : 'Step 2 of 2: Admin Account Setup'
            }
          </p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleCompanyInfoSubmit} className="space-y-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-700">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="company_email"
                  name="company_email"
                  required
                  value={formData.company_email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="company@example.com"
                />
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

              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-700">
                  Company Address
                </label>
                <textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company address"
                />
              </div>

              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700">
                  Company Phone
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  to="/"
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Next: Admin Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminAccountSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin_first_name" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="admin_first_name"
                    name="admin_first_name"
                    required
                    value={formData.admin_first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label htmlFor="admin_last_name" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="admin_last_name"
                    name="admin_last_name"
                    required
                    value={formData.admin_last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="admin_email"
                  name="admin_email"
                  required
                  value={formData.admin_email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="admin_phone" className="block text-sm font-medium text-gray-700">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  id="admin_phone"
                  name="admin_phone"
                  value={formData.admin_phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="admin_password"
                  name="admin_password"
                  required
                  value={formData.admin_password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup;

