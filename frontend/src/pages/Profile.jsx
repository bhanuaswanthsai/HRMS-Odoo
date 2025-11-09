import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingResume, setEditingResume] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [authUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${authUser.id}/profile`);
      const data = response.data.user || response.data;
      setProfileData(data);
      setFormData({
        ...data,
        resume: data.resume || '',
      });
      setAvatarPreview(data.avatar);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveResume = async () => {
    try {
      await api.put(`/users/${authUser.id}/profile`, { resume: formData.resume || null });
      toast.success('Resume updated successfully');
      setEditingResume(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Resume update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update resume');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with Avatar and Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profileData.name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-2xl border-4 border-gray-200">
                {getInitials(profileData.name || profileData.first_name)}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-lg font-semibold">{profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Login ID</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.login_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Mobile</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.phone_number || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Company</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.company_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Department</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.department || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Manager</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.manager_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Location</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.location || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['resume', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Resume Tab */}
          {activeTab === 'resume' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Resume</h3>
                {!editingResume && (
                  <button
                    onClick={() => {
                      setEditingResume(true);
                      setFormData({ ...formData, resume: profileData.resume || '' });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {profileData.resume ? 'Edit Resume' : 'Add Resume'}
                  </button>
                )}
              </div>

              {editingResume ? (
                <div className="space-y-4">
                  <textarea
                    name="resume"
                    value={formData.resume || ''}
                    onChange={handleInputChange}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Paste your resume here or type your resume content..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveResume}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Save Resume
                    </button>
                    <button
                      onClick={() => {
                        setEditingResume(false);
                        setFormData({ ...formData, resume: profileData.resume || '' });
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  {profileData.resume ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{profileData.resume}</p>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No resume added yet</p>
                      <button
                        onClick={() => {
                          setEditingResume(true);
                          setFormData({ ...formData, resume: '' });
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add Resume
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <SecurityTab user={authUser} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SecurityTab = ({ user }) => {
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Old Password</label>
        <input
          type="password"
          required
          value={passwordData.old_password}
          onChange={(e) =>
            setPasswordData({ ...passwordData, old_password: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          required
          value={passwordData.new_password}
          onChange={(e) =>
            setPasswordData({ ...passwordData, new_password: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input
          type="password"
          required
          value={passwordData.confirm_password}
          onChange={(e) =>
            setPasswordData({ ...passwordData, confirm_password: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};

export default Profile;
