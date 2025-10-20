import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await apiService.getUserProfile();
      setProfile(result.data || result);
      setFormData(result.data || result);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Fallback profile
      const fallbackProfile = {
        userId: 'user123',
        email: 'josephera7@gmail.com',
        firstName: 'Joseph',
        lastName: 'Vera',
        role: 'Admin',
        company: 'SageSoft Solutions',
        preferences: { theme: 'light', notifications: true }
      };
      setProfile(fallbackProfile);
      setFormData(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferences: formData.preferences
      };
      await apiService.updateUserProfile(updates);
      setProfile({ ...profile, ...updates });
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editing 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {editing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.firstName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.lastName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-gray-900">{profile.role}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <p className="text-gray-900">{profile.company || 'SageSoft Solutions'}</p>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              {editing ? (
                <select
                  value={formData.preferences?.defaultCurrency || 'USD'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, defaultCurrency: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile.preferences?.defaultCurrency || 'USD'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Region</label>
              {editing ? (
                <select
                  value={formData.preferences?.defaultRegion || 'us-east-1'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, defaultRegion: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              ) : (
                <p className="text-gray-900">{profile.preferences?.defaultRegion || 'us-east-1'}</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.preferences?.emailNotifications !== false}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, emailNotifications: e.target.checked }
                  })}
                  disabled={!editing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email Notifications</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.preferences?.documentReady !== false}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, documentReady: e.target.checked }
                  })}
                  disabled={!editing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Document Ready Notifications</span>
              </label>
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-4">
            <button
              onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;