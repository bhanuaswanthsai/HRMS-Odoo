import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, fetchProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    base_salary: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        base_salary: user.base_salary || '',
      });
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!profileImage) {
      toast.error('Please select an image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', profileImage);

      await api.post('/users/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile image updated successfully');
      setShowImageModal(false);
      setProfileImage(null);
      setImagePreview(null);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/users/${user.id}`, formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
      setShowEditModal(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImageModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Edit Image
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="flex items-center mb-6">
          {user.has_profile_image ? (
            <img
              src={`http://localhost:5003/api/users/profile/image/${user.id}`}
              alt={user.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-blue-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center ${user.has_profile_image ? 'hidden' : ''}`}
          >
            <span className="text-3xl font-bold text-blue-600">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <p className="mt-1 text-sm text-gray-900">{user.department || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
            <p className="mt-1 text-sm text-gray-900">₹{user.base_salary || 0}</p>
          </div>
          {user.hr_assigned && (
            <div>
              <label className="block text-sm font-medium text-gray-700">HR Assigned</label>
              <p className="mt-1 text-sm text-gray-900">{user.hr_assigned.name} ({user.hr_assigned.email})</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.status}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Change Password
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                <input
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Old Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      old_password: '',
                      new_password: '',
                      confirm_password: '',
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Update Profile Image</h3>
            <form onSubmit={handleImageUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-full object-cover mx-auto border-2 border-gray-300"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false);
                    setProfileImage(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

