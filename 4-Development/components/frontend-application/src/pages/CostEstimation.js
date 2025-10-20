import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CostEstimation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [realTimeCost, setRealTimeCost] = useState({ monthly: 0, annual: 0 });
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, name: 'Client Info', icon: '👤' },
    { id: 2, name: 'Compute', icon: '💻' },
    { id: 3, name: 'Storage', icon: '💾' },
    { id: 4, name: 'Network', icon: '🌐' },
    { id: 5, name: 'Database', icon: '🗄️' },
    { id: 6, name: 'Security', icon: '🔒' },
    { id: 7, name: 'Review', icon: '📋' }
  ];

  // Mock cost calculation
  useEffect(() => {
    const calculateCost = () => {
      let monthly = 0;
      
      // Basic calculations based on form data
      if (formData.ec2Instances) {
        const instanceCosts = {
          't3.micro': 8.5,
          't3.small': 17,
          't3.medium': 34,
          'm5.large': 70,
          'm5.xlarge': 140
        };
        monthly += (formData.ec2Instances || 0) * (instanceCosts[formData.instanceType] || 0);
      }
      
      if (formData.storageSize) {
        monthly += formData.storageSize * 0.10; // $0.10 per GB
      }
      
      if (formData.rdsInstances) {
        monthly += formData.rdsInstances * 50; // Base RDS cost
      }
      
      setRealTimeCost({
        monthly: Math.round(monthly),
        annual: Math.round(monthly * 12)
      });
    };
    
    calculateCost();
  }, [formData]);

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.clientName) newErrors.clientName = 'Client name is required';
        if (!formData.projectName) newErrors.projectName = 'Project name is required';
        break;
      case 2:
        if (!formData.ec2Instances || formData.ec2Instances < 1) newErrors.ec2Instances = 'At least 1 instance required';
        if (!formData.instanceType) newErrors.instanceType = 'Instance type is required';
        break;
      // Add more validation as needed
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const saveDraft = () => {
    // TODO: Implement save draft functionality
    alert('Draft saved successfully!');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName || ''}
                  onChange={(e) => updateFormData({ clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter client name"
                />
                {errors.clientName && <p className="text-red-600 text-sm mt-1">{errors.clientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.projectName || ''}
                  onChange={(e) => updateFormData({ projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
                {errors.projectName && <p className="text-red-600 text-sm mt-1">{errors.projectName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Region
                </label>
                <select
                  value={formData.region || ''}
                  onChange={(e) => updateFormData({ region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => updateFormData({ contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@company.com"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Compute Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of EC2 Instances *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.ec2Instances || ''}
                  onChange={(e) => updateFormData({ ec2Instances: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                {errors.ec2Instances && <p className="text-red-600 text-sm mt-1">{errors.ec2Instances}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance Type *
                </label>
                <select
                  value={formData.instanceType || ''}
                  onChange={(e) => updateFormData({ instanceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select instance type</option>
                  <option value="t3.micro">t3.micro (1 vCPU, 1 GB RAM) - $8.50/mo</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GB RAM) - $17/mo</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GB RAM) - $34/mo</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GB RAM) - $70/mo</option>
                  <option value="m5.xlarge">m5.xlarge (4 vCPU, 16 GB RAM) - $140/mo</option>
                </select>
                {errors.instanceType && <p className="text-red-600 text-sm mt-1">{errors.instanceType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating System
                </label>
                <select
                  value={formData.operatingSystem || ''}
                  onChange={(e) => updateFormData({ operatingSystem: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select OS</option>
                  <option value="amazon-linux">Amazon Linux 2</option>
                  <option value="ubuntu">Ubuntu Server</option>
                  <option value="windows">Windows Server</option>
                  <option value="rhel">Red Hat Enterprise Linux</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Load Balancer Required?
                </label>
                <select
                  value={formData.loadBalancer || ''}
                  onChange={(e) => updateFormData({ loadBalancer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="none">No Load Balancer</option>
                  <option value="alb">Application Load Balancer</option>
                  <option value="nlb">Network Load Balancer</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Storage Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EBS Storage Size (GB)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.storageSize || ''}
                  onChange={(e) => updateFormData({ storageSize: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Type
                </label>
                <select
                  value={formData.storageType || ''}
                  onChange={(e) => updateFormData({ storageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select storage type</option>
                  <option value="gp3">General Purpose SSD (gp3)</option>
                  <option value="gp2">General Purpose SSD (gp2)</option>
                  <option value="io2">Provisioned IOPS SSD (io2)</option>
                  <option value="st1">Throughput Optimized HDD (st1)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  S3 Storage Required?
                </label>
                <select
                  value={formData.s3Required || ''}
                  onChange={(e) => updateFormData({ s3Required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No S3 Storage</option>
                  <option value="standard">S3 Standard</option>
                  <option value="ia">S3 Infrequent Access</option>
                  <option value="glacier">S3 Glacier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Requirements
                </label>
                <select
                  value={formData.backupRequired || ''}
                  onChange={(e) => updateFormData({ backupRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select backup option</option>
                  <option value="none">No Backup</option>
                  <option value="daily">Daily Backup</option>
                  <option value="weekly">Weekly Backup</option>
                  <option value="monthly">Monthly Backup</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Network Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VPC Configuration
                </label>
                <select
                  value={formData.vpcConfig || ''}
                  onChange={(e) => updateFormData({ vpcConfig: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select VPC option</option>
                  <option value="default">Use Default VPC</option>
                  <option value="custom">Create Custom VPC</option>
                  <option value="existing">Use Existing VPC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internet Gateway Required?
                </label>
                <select
                  value={formData.internetGateway || ''}
                  onChange={(e) => updateFormData({ internetGateway: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NAT Gateway Required?
                </label>
                <select
                  value={formData.natGateway || ''}
                  onChange={(e) => updateFormData({ natGateway: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="none">No NAT Gateway</option>
                  <option value="single">Single NAT Gateway</option>
                  <option value="multi-az">Multi-AZ NAT Gateway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CloudFront CDN Required?
                </label>
                <select
                  value={formData.cloudfront || ''}
                  onChange={(e) => updateFormData({ cloudfront: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No CDN</option>
                  <option value="basic">Basic CloudFront</option>
                  <option value="premium">Premium CloudFront</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Database Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database Required?
                </label>
                <select
                  value={formData.databaseRequired || ''}
                  onChange={(e) => updateFormData({ databaseRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No Database</option>
                  <option value="rds">Amazon RDS</option>
                  <option value="dynamodb">Amazon DynamoDB</option>
                  <option value="both">Both RDS and DynamoDB</option>
                </select>
              </div>
              {(formData.databaseRequired === 'rds' || formData.databaseRequired === 'both') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RDS Engine
                    </label>
                    <select
                      value={formData.rdsEngine || ''}
                      onChange={(e) => updateFormData({ rdsEngine: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select engine</option>
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mariadb">MariaDB</option>
                      <option value="oracle">Oracle</option>
                      <option value="sqlserver">SQL Server</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RDS Instance Class
                    </label>
                    <select
                      value={formData.rdsInstanceClass || ''}
                      onChange={(e) => updateFormData({ rdsInstanceClass: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select instance class</option>
                      <option value="db.t3.micro">db.t3.micro</option>
                      <option value="db.t3.small">db.t3.small</option>
                      <option value="db.t3.medium">db.t3.medium</option>
                      <option value="db.m5.large">db.m5.large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Multi-AZ Deployment?
                    </label>
                    <select
                      value={formData.multiAZ || ''}
                      onChange={(e) => updateFormData({ multiAZ: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select option</option>
                      <option value="no">Single AZ</option>
                      <option value="yes">Multi-AZ</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Security Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSL Certificate Required?
                </label>
                <select
                  value={formData.sslCertificate || ''}
                  onChange={(e) => updateFormData({ sslCertificate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No SSL Certificate</option>
                  <option value="acm">AWS Certificate Manager</option>
                  <option value="third-party">Third-party Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WAF Protection Required?
                </label>
                <select
                  value={formData.wafProtection || ''}
                  onChange={(e) => updateFormData({ wafProtection: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No WAF</option>
                  <option value="basic">Basic WAF</option>
                  <option value="advanced">Advanced WAF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption at Rest?
                </label>
                <select
                  value={formData.encryptionAtRest || ''}
                  onChange={(e) => updateFormData({ encryptionAtRest: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="no">No Encryption</option>
                  <option value="aws-managed">AWS Managed Keys</option>
                  <option value="customer-managed">Customer Managed Keys</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Requirements
                </label>
                <select
                  value={formData.compliance || ''}
                  onChange={(e) => updateFormData({ compliance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select compliance</option>
                  <option value="none">No Specific Compliance</option>
                  <option value="hipaa">HIPAA</option>
                  <option value="pci">PCI DSS</option>
                  <option value="sox">SOX</option>
                  <option value="gdpr">GDPR</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Review & Summary</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Configuration Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Client:</strong> {formData.clientName || 'Not specified'}</div>
                <div><strong>Project:</strong> {formData.projectName || 'Not specified'}</div>
                <div><strong>Region:</strong> {formData.region || 'Not specified'}</div>
                <div><strong>EC2 Instances:</strong> {formData.ec2Instances || 0} x {formData.instanceType || 'Not specified'}</div>
                <div><strong>Storage:</strong> {formData.storageSize || 0} GB {formData.storageType || ''}</div>
                <div><strong>Database:</strong> {formData.databaseRequired || 'Not specified'}</div>
                <div><strong>Load Balancer:</strong> {formData.loadBalancer || 'Not specified'}</div>
                <div><strong>Security:</strong> {formData.sslCertificate || 'Not specified'}</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-4">Next Steps</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Review all configuration details above</p>
                <p>• Click "Generate Estimation" to create the cost calculation</p>
                <p>• You'll be able to download the estimation report</p>
                <p>• Save this estimation for future reference</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/new-estimation')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Input Selection
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Manual Cost Estimation</h1>
          <p className="text-gray-600 mt-2">Step-by-step guided form</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      currentStep === step.id
                        ? 'bg-blue-100 text-blue-800'
                        : currentStep > step.id
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <span className="text-xl">{step.icon}</span>
                    <span className="text-sm font-medium">{step.name}</span>
                    {currentStep > step.id && <span className="text-green-600">✓</span>}
                  </div>
                ))}
              </div>
              
              {/* Real-time Cost Display */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Estimated Cost</h4>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-green-600">
                    ${realTimeCost.monthly.toLocaleString()}/mo
                  </div>
                  <div className="text-sm text-gray-600">
                    ${realTimeCost.annual.toLocaleString()}/year
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {renderStepContent()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={saveDraft}
                    className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Save Draft
                  </button>
                </div>
                
                <div>
                  {currentStep < 7 ? (
                    <button
                      onClick={nextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/cost-results', { state: { formData, cost: realTimeCost } })}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Generate Estimation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimation;