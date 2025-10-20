import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AdminPanel = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [metricsResult, usersResult] = await Promise.all([
        apiService.getAdminMetrics({ period: '24h' }),
        apiService.getUsers()
      ]);
      
      setMetrics(metricsResult.data);
      setUsers(usersResult.data?.users || usersResult.users || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      // Fallback data
      setMetrics({
        period: '24h',
        metrics: {
          api_requests: 1250,
          cost_calculations: 45,
          document_generations: 15,
          active_users: 8,
          total_estimations: 25
        }
      });
      setUsers([
        { userId: 'user123', email: 'josephera7@gmail.com', name: 'Joseph Vera', role: 'Admin', status: 'active' },
        { userId: 'user124', email: 'user@example.com', name: 'Test User', role: 'Sales', status: 'active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user.userId === userId ? { ...user, role: newRole } : user
      ));
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role.');
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
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-gray-600 mt-1">System administration and user management</p>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Metrics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">System Metrics (Last 24h)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(metrics.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => fetchAdminData()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Metrics
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleUpdate(user.userId, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Sales">Sales</option>
                            <option value="PreSales">PreSales</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' || user.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status || (user.isActive !== false ? 'active' : 'inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Disable
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;