import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';

const CostResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData = {}, cost = { monthly: 0, annual: 0 } } = location.state || {};

  // Mock detailed cost breakdown
  const costBreakdown = {
    compute: {
      ec2: (formData.ec2Instances || 0) * 70,
      loadBalancer: formData.loadBalancer === 'alb' ? 25 : formData.loadBalancer === 'nlb' ? 30 : 0
    },
    storage: {
      ebs: (formData.storageSize || 0) * 0.10,
      s3: formData.s3Required === 'standard' ? 50 : 0
    },
    database: {
      rds: formData.databaseRequired === 'rds' || formData.databaseRequired === 'both' ? 150 : 0,
      dynamodb: formData.databaseRequired === 'dynamodb' || formData.databaseRequired === 'both' ? 25 : 0
    },
    network: {
      natGateway: formData.natGateway === 'single' ? 45 : formData.natGateway === 'multi-az' ? 90 : 0,
      cloudfront: formData.cloudfront === 'basic' ? 20 : formData.cloudfront === 'premium' ? 50 : 0
    },
    security: {
      waf: formData.wafProtection === 'basic' ? 15 : formData.wafProtection === 'advanced' ? 35 : 0,
      kms: formData.encryptionAtRest !== 'no' ? 10 : 0
    }
  };

  const totalByCategory = {
    compute: costBreakdown.compute.ec2 + costBreakdown.compute.loadBalancer,
    storage: costBreakdown.storage.ebs + costBreakdown.storage.s3,
    database: costBreakdown.database.rds + costBreakdown.database.dynamodb,
    network: costBreakdown.network.natGateway + costBreakdown.network.cloudfront,
    security: costBreakdown.security.waf + costBreakdown.security.kms
  };

  const grandTotal = Object.values(totalByCategory).reduce((sum, value) => sum + value, 0);

  // Mock optimization recommendations
  const recommendations = [
    {
      title: 'Reserved Instances',
      description: 'Save up to 30% by committing to 1-year Reserved Instances',
      savings: Math.round(grandTotal * 0.3),
      priority: 'high'
    },
    {
      title: 'Right-size Instances',
      description: 'Consider t3.small instead of m5.large for development workloads',
      savings: Math.round(grandTotal * 0.15),
      priority: 'medium'
    },
    {
      title: 'Storage Optimization',
      description: 'Use S3 Intelligent Tiering for automatic cost optimization',
      savings: Math.round(totalByCategory.storage * 0.25),
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/estimation')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Form
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Cost Estimation Results</h1>
          <p className="text-gray-600 mt-2">
            {formData.clientName && `${formData.clientName} - `}
            {formData.projectName || 'Unnamed Project'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-8">
            {/* Total Cost Display */}
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Total Estimated Cost</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ${grandTotal.toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-600">per month</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    ${(grandTotal * 12).toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-600">per year</div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown by Category */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Cost Breakdown by Service Category</h3>
              <div className="space-y-4">
                {Object.entries(totalByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-gray-900 capitalize">{category}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${getPercentage(amount, grandTotal)}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 w-20 text-right">
                        ${amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {getPercentage(amount, grandTotal)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Service Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Service Breakdown</h3>
              <div className="space-y-6">
                {Object.entries(costBreakdown).map(([category, services]) => (
                  <div key={category}>
                    <h4 className="text-lg font-medium text-gray-900 mb-3 capitalize">{category}</h4>
                    <div className="space-y-2 ml-4">
                      {Object.entries(services).map(([service, cost]) => (
                        cost > 0 && (
                          <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-700 capitalize">{service.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium text-gray-900">${cost.toLocaleString()}/mo</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">💡 Optimization Recommendations</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <div className="text-green-600 font-semibold">
                      Potential savings: ${rec.savings.toLocaleString()}/month
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/documents', { state: { formData, cost: { monthly: grandTotal, annual: grandTotal * 12 } } })}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📄 Generate Document
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const estimationData = {
                        projectName: formData.projectName || 'Cost Results',
                        description: 'Saved from cost results',
                        inputMethod: 'MANUAL_ENTRY',
                        clientInfo: { companyName: formData.clientName || 'Unknown Client' },
                        requirements: formData,
                        estimationSummary: { totalMonthlyCost: grandTotal, totalAnnualCost: grandTotal * 12 }
                      };
                      const result = await apiService.createEstimation(estimationData);
                      alert(`Estimation saved! ID: ${result.data.estimationId}`);
                    } catch (error) {
                      alert('Failed to save estimation. Please try again.');
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 Save Estimation
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const configurations = [
                        { name: 'Current', requirements: formData },
                        { name: 'Optimized', requirements: { ...formData, instanceType: 't3.medium' } }
                      ];
                      const result = await apiService.compareConfigurations(configurations);
                      alert(`Comparison complete! Recommended: ${result.data.recommendedConfiguration}`);
                    } catch (error) {
                      alert('Comparison feature temporarily unavailable.');
                    }
                  }}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📊 Compare Options
                </button>
                <button 
                  onClick={() => alert('Share functionality will be implemented')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔗 Share Results
                </button>
              </div>

              {/* Configuration Summary */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuration Summary</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Region:</strong> {formData.region || 'Not specified'}</div>
                  <div><strong>Instances:</strong> {formData.ec2Instances || 0} x {formData.instanceType || 'N/A'}</div>
                  <div><strong>Storage:</strong> {formData.storageSize || 0} GB</div>
                  <div><strong>Database:</strong> {formData.databaseRequired || 'None'}</div>
                  <div><strong>Load Balancer:</strong> {formData.loadBalancer || 'None'}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/estimation')}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✏️ Edit Configuration
                  </button>
                  <button 
                    onClick={() => navigate('/new-estimation')}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    🆕 New Estimation
                  </button>
                  <button 
                    onClick={() => navigate('/estimations')}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📋 View All Estimations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostResults;