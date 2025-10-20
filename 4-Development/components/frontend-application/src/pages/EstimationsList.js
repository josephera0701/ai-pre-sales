import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const EstimationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    fetchEstimations();
  }, [searchTerm, filterStatus]);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 20,
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm || undefined
      };
      const result = await apiService.getEstimations(params);
      
      // Transform API data to match UI expectations
      const transformedEstimations = result.data.estimations.map(est => ({
        id: est.estimationId,
        client: est.projectName || est.clientInfo?.companyName || 'Unnamed Project',
        cost: est.estimationSummary?.totalMonthlyCost || 0,
        date: new Date(est.createdAt).toLocaleDateString(),
        status: est.status?.toLowerCase() || 'draft',
        shared: est.sharedWith?.length > 0 || false,
        estimationId: est.estimationId
      }));
      
      setEstimations(transformedEstimations);
      setPagination(result.data.pagination || { currentPage: 1, totalPages: 1 });
    } catch (error) {
      console.error('Failed to fetch estimations:', error);
      // Fallback to mock data
      setEstimations([
        { id: 1, client: 'ABC Corp Infrastructure', cost: 8500, date: '2024-01-15', status: 'completed', shared: true },
        { id: 2, client: 'XYZ Migration Project', cost: 12300, date: '2024-01-14', status: 'completed', shared: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEstimations = estimations.filter(estimation => {
    const matchesSearch = estimation.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || estimation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Estimations</h1>
          <p className="text-gray-600 mt-2">Manage and view all your cost estimations</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search estimations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <button
                onClick={() => navigate('/new-estimation')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Estimation
              </button>
            </div>
          </div>
        </div>

        {/* Estimations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEstimations.map((estimation) => (
            <div key={estimation.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {estimation.client}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estimation.status)}`}>
                    {estimation.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Cost:</span>
                    <span className="font-semibold text-gray-900">${estimation.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-900">{estimation.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shared:</span>
                    <span className={estimation.shared ? 'text-green-600' : 'text-gray-400'}>
                      {estimation.shared ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        const result = await apiService.getEstimation(estimation.estimationId || estimation.id);
                        navigate('/cost-results', { state: { formData: result.data, cost: { monthly: estimation.cost, annual: estimation.cost * 12 } } });
                      } catch (error) {
                        alert('Unable to load estimation details.');
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => navigate('/estimation', { state: { estimationId: estimation.estimationId || estimation.id } })}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const result = await apiService.cloneEstimation(estimation.estimationId || estimation.id, { projectName: `${estimation.client} (Copy)` });
                        alert(`Estimation cloned! New ID: ${result.data.estimationId}`);
                        fetchEstimations();
                      } catch (error) {
                        alert('Failed to clone estimation.');
                      }
                    }}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    Clone
                  </button>
                  <button 
                    onClick={() => navigate('/documents', { state: { formData: { clientName: estimation.client }, cost: { monthly: estimation.cost, annual: estimation.cost * 12 } } })}
                    className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors"
                  >
                    Generate
                  </button>
                  <button 
                    onClick={() => alert('Share functionality will be implemented')}
                    className="bg-purple-100 text-purple-700 px-3 py-2 rounded text-sm hover:bg-purple-200 transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEstimations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No estimations found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first estimation.'}
            </p>
            <button
              onClick={() => navigate('/new-estimation')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Estimation
            </button>
          </div>
        )}

        {/* Pagination (placeholder) */}
        {filteredEstimations.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <span className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</span>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimationsList;