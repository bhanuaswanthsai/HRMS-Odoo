import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user: authUser, updateUser, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isAdminOrPayroll = authUser?.role === 'admin' || authUser?.role === 'payroll';

  useEffect(() => {
    fetchUserProfile();
  }, [authUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${authUser.id}/profile`);
      const data = response.data.user || response.data;
      setProfileData(data);
      // Initialize formData with all profile data, ensuring name is set
      setFormData({
        ...data,
        name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim()
      });
      setAvatarPreview(data.avatar);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size should be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      if (base64.length > 500000) {
        toast.error('Image is too large. Please compress it.');
        return;
      }
      setAvatarPreview(base64);
      handleSaveAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (avatarBase64) => {
    try {
      setUploadingAvatar(true);
      await api.put(`/users/${authUser.id}/avatar`, { avatar: avatarBase64 });
      toast.success('Avatar updated successfully');
      fetchUserProfile();
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (field, index, value) => {
    const current = formData[field] || [];
    const updated = [...current];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const handleAddArrayItem = (field) => {
    const current = formData[field] || [];
    setFormData(prev => ({ ...prev, [field]: [...current, ''] }));
  };

  const handleRemoveArrayItem = (field, index) => {
    const current = formData[field] || [];
    setFormData(prev => ({ ...prev, [field]: current.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    try {
      // Ensure name is updated if first_name or last_name changed
      const firstName = formData.first_name || profileData.first_name || '';
      const lastName = formData.last_name || profileData.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Prepare data to save - include all fields from formData
      const dataToSave = {
        ...formData,
        name: fullName || formData.name || profileData.name,
        first_name: firstName,
        last_name: lastName
      };
      
      await api.put(`/users/${authUser.id}/profile`, dataToSave);
      toast.success('Profile updated successfully');
      setEditing(false);
      setEditingResume(false);
      fetchUserProfile();
      // Update auth context if name changed
      if (fullName && fullName !== profileData.name) {
        updateUser({ ...authUser, name: fullName });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleSaveResume = async () => {
    try {
      await api.put(`/users/${authUser.id}/profile`, { resume: formData.resume });
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
              <img
                src={avatarPreview}
                alt={profileData.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-2xl border-4 border-gray-200">
                {getInitials(profileData.name || profileData.first_name)}
              </div>
            )}
            {editing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <span className="text-xs">✏️</span>
              </label>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                <p className="mt-1 text-lg font-semibold">{profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Login ID</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.login_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Mobile</label>
              {editing ? (
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData.phone_number || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Company</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.company_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Department</label>
              {editing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData.department || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Manager</label>
              <p className="mt-1 text-sm text-gray-900">{profileData.manager_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Location</label>
              {editing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData.location || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  // Reset formData to current profile data when entering edit mode
                  setFormData({
                    ...profileData,
                    name: profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                  });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Save Profile
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    // Reset formData to original profile data
                    setFormData({
                      ...profileData,
                      name: profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                    });
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['resume', 'private_info', 'salary_info', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
                        setFormData(profileData);
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

          {/* Private Info Tab */}
          {activeTab === 'private_info' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  {editing ? (
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.date_of_birth || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Residing Address</label>
                  {editing ? (
                    <textarea
                      name="residing_address"
                      value={formData.residing_address || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.residing_address || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  {editing ? (
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.nationality || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                  {editing ? (
                    <input
                      type="email"
                      name="personal_email"
                      value={formData.personal_email || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.personal_email || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.gender || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                  {editing ? (
                    <select
                      name="marital_status"
                      value={formData.marital_status || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profileData.marital_status || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                  <p className="mt-1 text-sm text-gray-900">{profileData.date_of_joining || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">About</label>
                  {editing ? (
                    <textarea
                      name="about"
                      value={formData.about || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profileData.about || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">What I love about my job</label>
                  {editing ? (
                    <textarea
                      name="job_likes"
                      value={formData.job_likes || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="What do you love about your job?"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profileData.job_likes || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">My interests and hobbies</label>
                  {editing ? (
                    <textarea
                      name="interests_hobbies"
                      value={formData.interests_hobbies || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Your interests and hobbies..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profileData.interests_hobbies || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Skills & Certifications</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  {editing ? (
                    <div className="space-y-2">
                      {(formData.skills || []).map((skill, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleArrayInputChange('skills', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Skill name"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem('skills', index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem('skills')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Skill
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(profileData.skills || []).length > 0 ? (
                        profileData.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills added</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  {editing ? (
                    <div className="space-y-2">
                      {(formData.certifications || []).map((cert, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => handleArrayInputChange('certifications', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Certification name"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem('certifications', index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem('certifications')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Certification
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(profileData.certifications || []).length > 0 ? (
                        profileData.certifications.map((cert, index) => (
                          <div key={index} className="px-3 py-2 bg-gray-100 rounded-md text-sm">
                            {cert}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No certifications added</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Save Button for Private Info */}
              {editing && (
                <div className="mt-6 pt-6 border-t flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData(profileData);
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Save Private Info
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Salary Info Tab - Only for Admin/Payroll */}
          {activeTab === 'salary_info' && (
            <div>
              {isAdminOrPayroll ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Month Wage</label>
                      {editing ? (
                        <input
                          type="number"
                          name="month_wage"
                          value={formData.month_wage || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">₹{profileData.month_wage || 0} / Month</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Yearly Wage</label>
                      {editing ? (
                        <input
                          type="number"
                          name="yearly_wage"
                          value={formData.yearly_wage || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">₹{profileData.yearly_wage || 0} / Yearly</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Working Days per Week</label>
                      {editing ? (
                        <input
                          type="number"
                          name="working_days_per_week"
                          value={formData.working_days_per_week || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{profileData.working_days_per_week || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Break Time (hours)</label>
                      {editing ? (
                        <input
                          type="number"
                          step="0.5"
                          name="break_time_hours"
                          value={formData.break_time_hours || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{profileData.break_time_hours || 'N/A'} hrs</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold mb-4">Salary Components</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Basic Salary */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Basic Salary</span>
                          <span className="text-sm text-gray-600">{profileData.basic_salary_percentage || 50}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">Define Basic salary from company cost compute it based on monthly Wages</p>
                      </div>

                      {/* HRA */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">House Rent Allowance (HRA)</span>
                          <span className="text-sm text-gray-600">{profileData.hra_percentage || 50}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100 * (profileData.hra_percentage || 50) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">HRA provided to employees 50% of the basic salary</p>
                      </div>

                      {/* Standard Allowance */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Standard Allowance</span>
                          <span className="text-sm text-gray-600">{profileData.standard_allowance_percentage || 16.67}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.standard_allowance_percentage || 16.67) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">A standard allowance is a predetermined, fixed amount provided to employee as part of their salary</p>
                      </div>

                      {/* Performance Bonus */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Performance Bonus</span>
                          <span className="text-sm text-gray-600">{profileData.performance_bonus_percentage || 8.33}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100 * (profileData.performance_bonus_percentage || 8.33) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary</p>
                      </div>

                      {/* LTA */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Leave Travel Allowance (LTA)</span>
                          <span className="text-sm text-gray-600">{profileData.lta_percentage || 8.33}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100 * (profileData.lta_percentage || 8.33) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">LTA is paid by the company to employees to cover their travel expenses. and calculated as a % of the basic salary</p>
                      </div>

                      {/* Fixed Allowance */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Fixed Allowance</span>
                          <span className="text-sm text-gray-600">{profileData.fixed_allowance_percentage || 11.67}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.fixed_allowance_percentage || 11.67) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">fixed allowance portion of wages is determined after calculating all salary components</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold mb-4">Provident Fund (PF) Contribution</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Employee</span>
                          <span className="text-sm text-gray-600">{profileData.pf_employee_percentage || 12}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100 * (profileData.pf_employee_percentage || 12) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Employer</span>
                          <span className="text-sm text-gray-600">{profileData.pf_employer_percentage || 12}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">₹{((profileData.month_wage || 0) * (profileData.basic_salary_percentage || 50) / 100 * (profileData.pf_employer_percentage || 12) / 100).toFixed(2)} / month</p>
                        <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold mb-4">Tax Deductions</h4>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Professional Tax</span>
                        <span className="text-sm text-gray-600">₹{profileData.professional_tax || 200} / month</span>
                      </div>
                      <p className="text-xs text-gray-500">Professional Tax deducted from the Gross salary</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold mb-4">Bank Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                        {editing ? (
                          <input
                            type="text"
                            name="bank_account_number"
                            value={formData.bank_account_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profileData.bank_account_number || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        {editing ? (
                          <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profileData.bank_name || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        {editing ? (
                          <input
                            type="text"
                            name="ifsc_code"
                            value={formData.ifsc_code || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profileData.ifsc_code || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                        {editing ? (
                          <input
                            type="text"
                            name="pan_number"
                            value={formData.pan_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profileData.pan_number || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UAN Number</label>
                        {editing ? (
                          <input
                            type="text"
                            name="uan_number"
                            value={formData.uan_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profileData.uan_number || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                        <p className="mt-1 text-sm text-gray-900">{profileData.emp_code || profileData.employee_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Salary information is only visible to Admin and Payroll Officers</p>
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
          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          required
          value={passwordData.new_password}
          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input
          type="password"
          required
          value={passwordData.confirm_password}
          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
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
