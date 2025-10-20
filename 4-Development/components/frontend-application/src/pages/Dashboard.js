import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/apiService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProjects: 0,
    monthlyTotal: 0,
    activeUsers: 0,
    recentEstimations: []
  });
  const [loading, setLoading] = useState(true);
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Corrected design: Use /dashboard/metrics for all users, /estimations for recent list
        const [dashboardResponse, estimationsResponse] = await Promise.all([
          apiService.getDashboardMetrics({ period: '24h' }),
          apiService.getEstimations({ 
            page: 1, 
            limit: 5, 
            sortBy: 'createdAt', 
            sortOrder: 'desc' 
          })
        ]);
        
        // Use dashboard metrics from API
        const dashboardData = dashboardResponse.data;
        const estimations = estimationsResponse.data.estimations || [];
        
        const realStats = {
          totalProjects: dashboardData.userMetrics?.totalProjects || estimations.length,
          monthlyTotal: dashboardData.userMetrics?.monthlyTotal || 0,
          activeUsers: dashboardData.systemMetrics?.teamSize || 1,
          recentEstimations: estimations.map(est => ({
            id: est.estimationId,
            client: est.clientInfo?.companyName || est.projectName,
            cost: est.estimationSummary?.totalMonthlyCost || 0,
            date: new Date(est.createdAt).toLocaleDateString(),
            status: est.status?.toLowerCase() || 'draft'
          }))
        };
        
        setStats(realStats);
        setUsingRealData(true);
        console.log('✅ Dashboard using corrected design - dashboard metrics:', { dashboardResponse, estimationsResponse });
        
      } catch (error) {
        console.error('Dashboard API failed:', error);
        setStats({
          totalProjects: 0,
          monthlyTotal: 0,
          activeUsers: 0,
          recentEstimations: [],
          error: 'API not responding'
        });
        setUsingRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Ready to create some cost estimations?</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Projects</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>
        <div className="metric-card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">This Month</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">${stats.monthlyTotal.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        <div className="metric-card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {user?.role === 'Admin' ? 'Active Users' : 'Team Members'}
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-8">
        <h2 className="section-header">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/new-estimation')}
            className="group p-8 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 card-hover"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl text-white">➕</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">New Estimation</div>
              <div className="text-gray-600 dark:text-gray-400">Create a new cost estimation</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/estimations')}
            className="group p-8 border-2 border-dashed border-green-300 dark:border-green-600 rounded-2xl hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 card-hover"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl text-white">📋</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Estimations</div>
              <div className="text-gray-600 dark:text-gray-400">View and manage estimations</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Estimations */}
      <div className="card">
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Estimations</h2>
          <button 
            onClick={() => navigate('/estimations')}
            className="btn-secondary text-sm"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats.recentEstimations.map((estimation) => (
            <div key={estimation.id} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{estimation.client.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{estimation.client}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{estimation.date}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ${estimation.cost.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">per month</div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  estimation.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                }`}>
                  {estimation.status}
                </span>
                <button className="btn-primary text-sm py-2 px-4">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Status Indicator */}
      <div className={`card p-6 ${usingRealData 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
        : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${usingRealData ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
            <span className="text-white text-sm">{usingRealData ? '✅' : '⚠️'}</span>
          </div>
          <p className={`${usingRealData ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'} font-medium`}>
            <strong>{usingRealData ? 'Live Data:' : 'Development Mode:'}</strong> 
            {usingRealData 
              ? 'Dashboard metrics powered by real /dashboard/metrics and /estimations endpoints!' 
              : stats.error ? 'API not responding - Backend services are currently unavailable.' : 'Loading dashboard data...'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;