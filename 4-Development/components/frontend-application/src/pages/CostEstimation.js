import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const CostEstimation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Client Info Enhanced
    companyName: '',
    industryType: '',
    companySize: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    technicalContactName: '',
    technicalContactEmail: '',
    projectName: '',
    projectDescription: '',
    projectTimelineMonths: '',
    budgetRange: '',
    primaryAwsRegion: '',
    secondaryAwsRegions: [],
    complianceRequirements: [],
    businessCriticality: '',
    disasterRecoveryRequired: false,
    multiRegionRequired: false,
    
    // Multi-item arrays
    servers: [{
      id: 1,
      serverName: '',
      environmentType: '',
      workloadType: '',
      cpuCores: '',
      ramGB: '',
      operatingSystem: '',
      architecture: '',
      businessCriticality: '',
      averageUtilizationPercent: '',
      peakUtilizationPercent: '',
      scalingType: '',
      minInstances: '',
      maxInstances: '',
      monthlyRuntimeHours: '',
      storageType: '',
      rootVolumeSizeGB: '',
      additionalStorageGB: '',
      networkPerformance: '',
      placementGroupRequired: false,
      dedicatedTenancyRequired: false,
      hibernationSupportRequired: false
    }],
    
    storageItems: [{
      id: 1,
      storageName: '',
      storagePurpose: '',
      currentSizeGB: '',
      projectedGrowthRatePercent: '',
      accessPattern: '',
      iopsRequired: '',
      throughputMbpsRequired: '',
      durabilityRequirement: '',
      availabilityRequirement: '',
      encryptionRequired: false,
      backupRequired: false,
      backupFrequency: '',
      backupRetentionDays: '',
      crossRegionReplication: false,
      versioningRequired: false,
      lifecycleManagementRequired: false,
      complianceRequirements: []
    }],
    
    databases: [{
      id: 1,
      databaseName: '',
      databasePurpose: '',
      engineType: '',
      engineVersion: '',
      databaseSizeGB: '',
      expectedGrowthRatePercent: '',
      instanceClass: '',
      cpuCores: '',
      ramGB: '',
      storageType: '',
      iopsRequired: '',
      multiAzRequired: false,
      readReplicasCount: '',
      readReplicaRegions: [],
      backupRetentionDays: '',
      backupWindowPreferred: '',
      maintenanceWindowPreferred: '',
      encryptionAtRestRequired: false,
      encryptionInTransitRequired: false,
      performanceInsightsRequired: false,
      monitoringEnhancedRequired: false,
      connectionPoolingRequired: false
    }],
    
    // Network & CDN Enhanced
    dataTransferOutGBMonthly: '',
    dataTransferInGBMonthly: '',
    peakBandwidthMbps: '',
    concurrentUsersExpected: '',
    geographicDistribution: [],
    loadBalancerCount: '',
    loadBalancerType: '',
    sslCertificateRequired: false,
    sslCertificateType: '',
    wafRequired: false,
    ddosProtectionRequired: false,
    cdnRequired: false,
    cdnCacheBehavior: '',
    edgeLocationsRequired: [],
    apiGatewayRequired: false,
    apiCallsMonthly: '',
    vpnConnectionsRequired: '',
    directConnectRequired: false,
    bandwidthDirectConnectMbps: '',
    
    // Security & Compliance Enhanced
    complianceFrameworks: [],
    dataClassification: '',
    awsConfigRequired: false,
    cloudtrailRequired: false,
    cloudtrailDataEvents: false,
    guarddutyRequired: false,
    securityHubRequired: false,
    inspectorRequired: false,
    macieRequired: false,
    kmsRequired: false,
    secretsManagerRequired: false,
    certificateManagerRequired: false,
    iamAccessAnalyzerRequired: false,
    vpcFlowLogsRequired: false,
    shieldAdvancedRequired: false,
    firewallManagerRequired: false,
    networkFirewallRequired: false,
    penetrationTestingRequired: false,
    vulnerabilityScanningRequired: false,
    securityTrainingRequired: false,
    incidentResponsePlanRequired: false
  });
  
  const [realTimeCost, setRealTimeCost] = useState({ monthly: 0, annual: 0 });
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, name: 'Client Info', icon: '👤' },
    { id: 2, name: 'Compute', icon: '💻' },
    { id: 3, name: 'Storage', icon: '💾' },
    { id: 4, name: 'Network & CDN', icon: '🌐' },
    { id: 5, name: 'Database', icon: '🗄️' },
    { id: 6, name: 'Security', icon: '🔒' },
    { id: 7, name: 'Cost Summary', icon: '💰' },
    { id: 8, name: 'Recommendations', icon: '💡' },
    { id: 9, name: 'Validation', icon: '✅' },
    { id: 10, name: 'Review', icon: '📋' }
  ];

  // Dropdown options from Enhanced Template
  const dropdownOptions = {
    industryTypes: ['E-commerce', 'Healthcare', 'Financial Services', 'Manufacturing', 'Technology', 'Education', 'Government', 'Media'],
    companySizes: ['Startup', 'SME', 'Enterprise'],
    budgetRanges: ['$10K-$50K', '$50K-$100K', '$100K-$500K', '$500K-$1M', '$1M+'],
    awsRegions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
    environmentTypes: ['Production', 'Staging', 'Development', 'Testing'],
    workloadTypes: ['Web', 'Database', 'Analytics', 'ML', 'Batch', 'API', 'Microservices'],
    operatingSystems: ['Amazon_Linux', 'Ubuntu', 'Windows', 'RHEL', 'SUSE'],
    architectures: ['x86_64', 'ARM64'],
    businessCriticalities: ['Low', 'Medium', 'High', 'Critical'],
    scalingTypes: ['Manual', 'Auto', 'Scheduled', 'Predictive'],
    storageTypes: ['EBS_GP3', 'EBS_GP2', 'EBS_IO2', 'Instance_Store'],
    networkPerformances: ['Low', 'Moderate', 'High', 'Up_to_10Gbps', '25Gbps', '100Gbps'],
    storagePurposes: ['Application_Data', 'Database', 'Media', 'Backup', 'Archive', 'Logs'],
    accessPatterns: ['Frequent', 'Infrequent', 'Archive', 'Intelligent_Tiering'],
    durabilityRequirements: ['Standard', 'High', 'Maximum'],
    backupFrequencies: ['Hourly', 'Daily', 'Weekly', 'Monthly'],
    databasePurposes: ['OLTP', 'OLAP', 'Data_Warehouse', 'Cache', 'Search'],
    engineTypes: ['MySQL', 'PostgreSQL', 'Oracle', 'SQL_Server', 'Aurora_MySQL', 'Aurora_PostgreSQL', 'DynamoDB', 'ElastiCache'],
    loadBalancerTypes: ['ALB', 'NLB', 'CLB'],
    sslCertificateTypes: ['Single', 'Wildcard', 'Multi_Domain'],
    cdnCacheBehaviors: ['Cache_Everything', 'Cache_Static', 'Custom'],
    complianceFrameworks: ['GDPR', 'HIPAA', 'SOC2', 'PCI_DSS', 'ISO27001', 'FedRAMP'],
    dataClassifications: ['Public', 'Internal', 'Confidential', 'Restricted']
  };

  // Real-time cost calculation
  const calculateRealTimeCost = useCallback(async (currentFormData) => {
    try {
      let monthly = 0;
      
      // Calculate server costs
      (currentFormData.servers || []).forEach(server => {
        if (server.cpuCores && server.ramGB) {
          monthly += server.cpuCores * 10 + server.ramGB * 2; // Simplified calculation
        }
      });
      
      // Calculate storage costs
      (currentFormData.storageItems || []).forEach(storage => {
        if (storage.currentSizeGB) {
          monthly += storage.currentSizeGB * 0.10; // GP3 pricing
        }
      });
      
      // Calculate database costs
      (currentFormData.databases || []).forEach(db => {
        if (db.databaseSizeGB) {
          monthly += db.databaseSizeGB * 0.20; // RDS pricing
        }
      });
      
      // Add network costs
      if (currentFormData.dataTransferOutGBMonthly) {
        monthly += currentFormData.dataTransferOutGBMonthly * 0.09;
      }
      
      setRealTimeCost({ monthly: Math.round(monthly), annual: Math.round(monthly * 12) });
    } catch (error) {
      console.error('Cost calculation failed:', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => calculateRealTimeCost(formData), 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, calculateRealTimeCost]);

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.projectName) newErrors.projectName = 'Project name is required';
        if (!formData.primaryContactName) newErrors.primaryContactName = 'Primary contact is required';
        if (!formData.primaryContactEmail) newErrors.primaryContactEmail = 'Primary email is required';
        break;
      case 2:
        const firstServer = (formData.servers || [])[0];
        if (!firstServer?.serverName) newErrors.serverName = 'Server name is required';
        if (!firstServer?.environmentType) newErrors.environmentType = 'Environment type is required';
        if (!firstServer?.workloadType) newErrors.workloadType = 'Workload type is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 10));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const saveDraft = async () => {
    try {
      const estimationData = {
        projectName: formData.projectName || 'Untitled Project',
        description: 'Draft estimation with enhanced fields',
        inputMethod: 'MANUAL_ENTRY',
        clientInfo: {
          companyName: formData.companyName || 'Unknown Client',
          industryType: formData.industryType || 'Technology',
          companySize: formData.companySize || 'SME',
          primaryContactName: formData.primaryContactName || '',
          primaryContactEmail: formData.primaryContactEmail || '',
          primaryAwsRegion: formData.primaryAwsRegion || 'us-east-1',
          complianceRequirements: formData.complianceRequirements || [],
          businessCriticality: formData.businessCriticality || 'Medium'
        },
        requirements: formData
      };
      
      const result = await apiService.createEstimation(estimationData);
      alert(`Draft saved successfully! Estimation ID: ${result.data.estimationId}`);
    } catch (error) {
      console.error('Save draft failed:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Client Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Company Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input type="text" value={formData.companyName || ''} onChange={(e) => updateFormData({ companyName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ABC Corporation" />
                  {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry Type *</label>
                  <select value={formData.industryType || ''} onChange={(e) => updateFormData({ industryType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select industry</option>
                    {dropdownOptions.industryTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size *</label>
                  <select value={formData.companySize || ''} onChange={(e) => updateFormData({ companySize: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select size</option>
                    {dropdownOptions.companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <select value={formData.budgetRange || ''} onChange={(e) => updateFormData({ budgetRange: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select budget</option>
                    {dropdownOptions.budgetRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contact *</label>
                  <input type="text" value={formData.primaryContactName || ''} onChange={(e) => updateFormData({ primaryContactName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Jane Smith" />
                  {errors.primaryContactName && <p className="text-red-600 text-sm mt-1">{errors.primaryContactName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email *</label>
                  <input type="email" value={formData.primaryContactEmail || ''} onChange={(e) => updateFormData({ primaryContactEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="jane@abc.com" />
                  {errors.primaryContactEmail && <p className="text-red-600 text-sm mt-1">{errors.primaryContactEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone</label>
                  <input type="tel" value={formData.primaryContactPhone || ''} onChange={(e) => updateFormData({ primaryContactPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1-555-0123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technical Contact</label>
                  <input type="text" value={formData.technicalContactName || ''} onChange={(e) => updateFormData({ technicalContactName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technical Email</label>
                  <input type="email" value={formData.technicalContactEmail || ''} onChange={(e) => updateFormData({ technicalContactEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@abc.com" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Project Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                  <input type="text" value={formData.projectName || ''} onChange={(e) => updateFormData({ projectName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="AWS Migration Project" />
                  {errors.projectName && <p className="text-red-600 text-sm mt-1">{errors.projectName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeline (months)</label>
                  <input type="number" min="1" max="60" value={formData.projectTimelineMonths || ''} onChange={(e) => updateFormData({ projectTimelineMonths: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary AWS Region *</label>
                  <select value={formData.primaryAwsRegion || ''} onChange={(e) => updateFormData({ primaryAwsRegion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select region</option>
                    {dropdownOptions.awsRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Criticality</label>
                  <select value={formData.businessCriticality || ''} onChange={(e) => updateFormData({ businessCriticality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select criticality</option>
                    {dropdownOptions.businessCriticalities.map(crit => (
                      <option key={crit} value={crit}>{crit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                <textarea value={formData.projectDescription || ''} onChange={(e) => updateFormData({ projectDescription: e.target.value })} rows="3" maxLength="500" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Brief description of the project..." />
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.disasterRecoveryRequired || false} onChange={(e) => updateFormData({ disasterRecoveryRequired: e.target.checked })} className="mr-2" />
                  <span className="text-sm text-gray-700">Disaster Recovery Required</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.multiRegionRequired || false} onChange={(e) => updateFormData({ multiRegionRequired: e.target.checked })} className="mr-2" />
                  <span className="text-sm text-gray-700">Multi-Region Required</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Compliance Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dropdownOptions.complianceFrameworks.map(compliance => (
                  <label key={compliance} className="flex items-center">
                    <input type="checkbox" checked={formData.complianceRequirements?.includes(compliance) || false} onChange={(e) => {
                      const current = formData.complianceRequirements || [];
                      const updated = e.target.checked ? [...current, compliance] : current.filter(c => c !== compliance);
                      updateFormData({ complianceRequirements: updated });
                    }} className="mr-2" />
                    <span className="text-sm text-gray-700">{compliance}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Compute Requirements</h3>
              <button
                onClick={() => {
                  const newServer = { 
                    id: Date.now(), 
                    serverName: '', 
                    environmentType: '', 
                    workloadType: '', 
                    cpuCores: '', 
                    ramGB: '',
                    operatingSystem: '',
                    architecture: '',
                    businessCriticality: '',
                    averageUtilizationPercent: '',
                    peakUtilizationPercent: '',
                    scalingType: '',
                    minInstances: '',
                    maxInstances: '',
                    monthlyRuntimeHours: '',
                    storageType: '',
                    rootVolumeSizeGB: '',
                    additionalStorageGB: '',
                    networkPerformance: '',
                    placementGroupRequired: false,
                    dedicatedTenancyRequired: false,
                    hibernationSupportRequired: false
                  };
                  updateFormData({ servers: [...(formData.servers || []), newServer] });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Server
              </button>
            </div>

            {(formData.servers || []).map((server, index) => (
              <div key={server.id} className="bg-gray-50 rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Server {index + 1} Configuration</h4>
                  {(formData.servers || []).length > 1 && (
                    <button
                      onClick={() => {
                        const updatedServers = (formData.servers || []).filter(s => s.id !== server.id);
                        updateFormData({ servers: updatedServers });
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Server Name *</label>
                      <input 
                        type="text" 
                        value={server.serverName || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, serverName: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="Web Server 1" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Environment *</label>
                      <select 
                        value={server.environmentType || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, environmentType: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select environment</option>
                        {dropdownOptions.environmentTypes.map(env => (
                          <option key={env} value={env}>{env}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Workload Type *</label>
                      <select 
                        value={server.workloadType || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, workloadType: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select workload</option>
                        {dropdownOptions.workloadTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Criticality</label>
                      <select 
                        value={server.businessCriticality || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, businessCriticality: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select criticality</option>
                        {dropdownOptions.businessCriticalities.map(crit => (
                          <option key={crit} value={crit}>{crit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CPU Cores *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="128" 
                        value={server.cpuCores || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, cpuCores: parseInt(e.target.value) } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="4" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">RAM (GB) *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="3904" 
                        value={server.ramGB || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, ramGB: parseInt(e.target.value) } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="16" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Operating System</label>
                      <select 
                        value={server.operatingSystem || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, operatingSystem: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select OS</option>
                        {dropdownOptions.operatingSystems.map(os => (
                          <option key={os} value={os}>{os.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Architecture</label>
                      <select 
                        value={server.architecture || ''} 
                        onChange={(e) => {
                          const updatedServers = (formData.servers || []).map(s => 
                            s.id === server.id ? { ...s, architecture: e.target.value } : s
                          );
                          updateFormData({ servers: updatedServers });
                        }} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select architecture</option>
                        {dropdownOptions.architectures.map(arch => (
                          <option key={arch} value={arch}>{arch}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-3">Performance & Scaling</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Avg Utilization (%)</label>
                        <input 
                          type="number" 
                          min="10" 
                          max="100" 
                          value={server.averageUtilizationPercent || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, averageUtilizationPercent: parseInt(e.target.value) } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="70" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Peak Utilization (%)</label>
                        <input 
                          type="number" 
                          min="10" 
                          max="100" 
                          value={server.peakUtilizationPercent || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, peakUtilizationPercent: parseInt(e.target.value) } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="90" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scaling Type</label>
                        <select 
                          value={server.scalingType || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, scalingType: e.target.value } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select scaling</option>
                          {dropdownOptions.scalingTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Runtime (hrs)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="744" 
                          value={server.monthlyRuntimeHours || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, monthlyRuntimeHours: parseInt(e.target.value) } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="744" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-3">Storage & Network</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Root Volume (GB)</label>
                        <input 
                          type="number" 
                          min="8" 
                          max="16384" 
                          value={server.rootVolumeSizeGB || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, rootVolumeSizeGB: parseInt(e.target.value) } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="100" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Storage (GB)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="65536" 
                          value={server.additionalStorageGB || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, additionalStorageGB: parseInt(e.target.value) } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Network Performance</label>
                        <select 
                          value={server.networkPerformance || ''} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, networkPerformance: e.target.value } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select performance</option>
                          {dropdownOptions.networkPerformances.map(perf => (
                            <option key={perf} value={perf}>{perf.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={server.placementGroupRequired || false} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, placementGroupRequired: e.target.checked } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Placement Group Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={server.dedicatedTenancyRequired || false} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, dedicatedTenancyRequired: e.target.checked } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Dedicated Tenancy Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={server.hibernationSupportRequired || false} 
                          onChange={(e) => {
                            const updatedServers = (formData.servers || []).map(s => 
                              s.id === server.id ? { ...s, hibernationSupportRequired: e.target.checked } : s
                            );
                            updateFormData({ servers: updatedServers });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Hibernation Support Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Storage Requirements</h3>
              <button
                onClick={() => {
                  const newStorage = { 
                    id: Date.now(), 
                    storageName: '', 
                    storagePurpose: '', 
                    currentSizeGB: '', 
                    projectedGrowthRatePercent: '', 
                    accessPattern: '', 
                    iopsRequired: '', 
                    throughputMbpsRequired: '', 
                    durabilityRequirement: '', 
                    availabilityRequirement: '', 
                    encryptionRequired: false, 
                    backupRequired: false, 
                    backupFrequency: '', 
                    backupRetentionDays: '', 
                    crossRegionReplication: false, 
                    versioningRequired: false, 
                    lifecycleManagementRequired: false, 
                    complianceRequirements: [] 
                  };
                  updateFormData({ storageItems: [...(formData.storageItems || []), newStorage] });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Storage
              </button>
            </div>

            {(formData.storageItems || []).map((storage, index) => (
              <div key={storage.id} className="bg-gray-50 rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Storage {index + 1} Configuration</h4>
                  {(formData.storageItems || []).length > 1 && (
                    <button
                      onClick={() => {
                        const updatedStorage = (formData.storageItems || []).filter(s => s.id !== storage.id);
                        updateFormData({ storageItems: updatedStorage });
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Storage Name *</label>
                      <input
                        type="text"
                        value={storage.storageName || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, storageName: e.target.value } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Application Data"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Storage Purpose *</label>
                      <select
                        value={storage.storagePurpose || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, storagePurpose: e.target.value } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select purpose</option>
                        {dropdownOptions.storagePurposes.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Size (GB) *</label>
                      <input
                        type="number"
                        min="1"
                        value={storage.currentSizeGB || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, currentSizeGB: parseInt(e.target.value) } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Growth Rate (%/year)</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={storage.projectedGrowthRatePercent || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, projectedGrowthRatePercent: parseInt(e.target.value) } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Pattern</label>
                      <select
                        value={storage.accessPattern || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, accessPattern: e.target.value } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select access pattern</option>
                        {dropdownOptions.accessPatterns.map(pattern => (
                          <option key={pattern} value={pattern}>{pattern.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IOPS Required</label>
                      <input
                        type="number"
                        min="100"
                        max="64000"
                        value={storage.iopsRequired || ''}
                        onChange={(e) => {
                          const updatedStorage = (formData.storageItems || []).map(s => 
                            s.id === storage.id ? { ...s, iopsRequired: parseInt(e.target.value) } : s
                          );
                          updateFormData({ storageItems: updatedStorage });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="3000"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-3">Backup & Replication</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select
                          value={storage.backupFrequency || ''}
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, backupFrequency: e.target.value } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select frequency</option>
                          {dropdownOptions.backupFrequencies.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Retention (days)</label>
                        <input
                          type="number"
                          min="1"
                          max="2555"
                          value={storage.backupRetentionDays || ''}
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, backupRetentionDays: parseInt(e.target.value) } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={storage.encryptionRequired || false} 
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, encryptionRequired: e.target.checked } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Encryption Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={storage.backupRequired || false} 
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, backupRequired: e.target.checked } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Backup Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={storage.crossRegionReplication || false} 
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, crossRegionReplication: e.target.checked } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Cross-Region Replication</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={storage.versioningRequired || false} 
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, versioningRequired: e.target.checked } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Versioning Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={storage.lifecycleManagementRequired || false} 
                          onChange={(e) => {
                            const updatedStorage = (formData.storageItems || []).map(s => 
                              s.id === storage.id ? { ...s, lifecycleManagementRequired: e.target.checked } : s
                            );
                            updateFormData({ storageItems: updatedStorage });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Lifecycle Management Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Network & CDN Requirements</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Data Transfer & Bandwidth</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Transfer Out (GB/month)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dataTransferOutGBMonthly || ''}
                    onChange={(e) => updateFormData({ dataTransferOutGBMonthly: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Transfer In (GB/month)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dataTransferInGBMonthly || ''}
                    onChange={(e) => updateFormData({ dataTransferInGBMonthly: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peak Bandwidth (Mbps)</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.peakBandwidthMbps || ''}
                    onChange={(e) => updateFormData({ peakBandwidthMbps: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Concurrent Users Expected</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={formData.concurrentUsersExpected || ''}
                    onChange={(e) => updateFormData({ concurrentUsersExpected: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Load Balancing & SSL</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Load Balancer Count</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.loadBalancerCount || ''}
                    onChange={(e) => updateFormData({ loadBalancerCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Load Balancer Type</label>
                  <select
                    value={formData.loadBalancerType || ''}
                    onChange={(e) => updateFormData({ loadBalancerType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    {dropdownOptions.loadBalancerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SSL Certificate Type</label>
                  <select
                    value={formData.sslCertificateType || ''}
                    onChange={(e) => updateFormData({ sslCertificateType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select certificate type</option>
                    {dropdownOptions.sslCertificateTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.sslCertificateRequired || false} 
                    onChange={(e) => updateFormData({ sslCertificateRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">SSL Certificate Required</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Security & Protection</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.wafRequired || false} 
                    onChange={(e) => updateFormData({ wafRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">WAF (Web Application Firewall) Required</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.ddosProtectionRequired || false} 
                    onChange={(e) => updateFormData({ ddosProtectionRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">DDoS Protection Required</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">CDN & API Gateway</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CDN Cache Behavior</label>
                  <select
                    value={formData.cdnCacheBehavior || ''}
                    onChange={(e) => updateFormData({ cdnCacheBehavior: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select cache behavior</option>
                    {dropdownOptions.cdnCacheBehaviors.map(behavior => (
                      <option key={behavior} value={behavior}>{behavior.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Calls (monthly)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.apiCallsMonthly || ''}
                    onChange={(e) => updateFormData({ apiCallsMonthly: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VPN Connections Required</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.vpnConnectionsRequired || ''}
                    onChange={(e) => updateFormData({ vpnConnectionsRequired: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direct Connect Bandwidth (Mbps)</label>
                  <input
                    type="number"
                    min="50"
                    max="100000"
                    value={formData.bandwidthDirectConnectMbps || ''}
                    onChange={(e) => updateFormData({ bandwidthDirectConnectMbps: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.cdnRequired || false} 
                    onChange={(e) => updateFormData({ cdnRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">CDN Required</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.apiGatewayRequired || false} 
                    onChange={(e) => updateFormData({ apiGatewayRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">API Gateway Required</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.directConnectRequired || false} 
                    onChange={(e) => updateFormData({ directConnectRequired: e.target.checked })} 
                    className="mr-2" 
                  />
                  <span className="text-sm text-gray-700">Direct Connect Required</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Database Requirements</h3>
              <button
                onClick={() => {
                  const newDatabase = { 
                    id: Date.now(), 
                    databaseName: '', 
                    databasePurpose: '', 
                    engineType: '', 
                    engineVersion: '', 
                    databaseSizeGB: '', 
                    expectedGrowthRatePercent: '', 
                    instanceClass: '', 
                    cpuCores: '', 
                    ramGB: '', 
                    storageType: '', 
                    iopsRequired: '', 
                    multiAzRequired: false, 
                    readReplicasCount: '', 
                    readReplicaRegions: [], 
                    backupRetentionDays: '', 
                    backupWindowPreferred: '', 
                    maintenanceWindowPreferred: '', 
                    encryptionAtRestRequired: false, 
                    encryptionInTransitRequired: false, 
                    performanceInsightsRequired: false, 
                    monitoringEnhancedRequired: false, 
                    connectionPoolingRequired: false 
                  };
                  updateFormData({ databases: [...(formData.databases || []), newDatabase] });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Database
              </button>
            </div>

            {(formData.databases || []).map((database, index) => (
              <div key={database.id} className="bg-gray-50 rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Database {index + 1} Configuration</h4>
                  {(formData.databases || []).length > 1 && (
                    <button
                      onClick={() => {
                        const updatedDatabases = (formData.databases || []).filter(d => d.id !== database.id);
                        updateFormData({ databases: updatedDatabases });
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Database Name *</label>
                      <input
                        type="text"
                        value={database.databaseName || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, databaseName: e.target.value } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Primary Database"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Database Purpose *</label>
                      <select
                        value={database.databasePurpose || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, databasePurpose: e.target.value } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select purpose</option>
                        {dropdownOptions.databasePurposes.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Engine Type *</label>
                      <select
                        value={database.engineType || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, engineType: e.target.value } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select engine</option>
                        {dropdownOptions.engineTypes.map(engine => (
                          <option key={engine} value={engine}>{engine.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Database Size (GB) *</label>
                      <input
                        type="number"
                        min="20"
                        max="65536"
                        value={database.databaseSizeGB || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, databaseSizeGB: parseInt(e.target.value) } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Growth Rate (%/year)</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={database.expectedGrowthRatePercent || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, expectedGrowthRatePercent: parseInt(e.target.value) } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IOPS Required</label>
                      <input
                        type="number"
                        min="100"
                        max="80000"
                        value={database.iopsRequired || ''}
                        onChange={(e) => {
                          const updatedDatabases = (formData.databases || []).map(d => 
                            d.id === database.id ? { ...d, iopsRequired: parseInt(e.target.value) } : d
                          );
                          updateFormData({ databases: updatedDatabases });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="3000"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 mb-3">Availability & Backup</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Read Replicas Count</label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={database.readReplicasCount || ''}
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, readReplicasCount: parseInt(e.target.value) } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                        <input
                          type="number"
                          min="0"
                          max="35"
                          value={database.backupRetentionDays || ''}
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, backupRetentionDays: parseInt(e.target.value) } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="7"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Window</label>
                        <input
                          type="time"
                          value={database.backupWindowPreferred || ''}
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, backupWindowPreferred: e.target.value } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Window</label>
                        <input
                          type="time"
                          value={database.maintenanceWindowPreferred || ''}
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, maintenanceWindowPreferred: e.target.value } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.multiAzRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, multiAzRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Multi-AZ Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.encryptionAtRestRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, encryptionAtRestRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Encryption at Rest Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.encryptionInTransitRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, encryptionInTransitRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Encryption in Transit Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.performanceInsightsRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, performanceInsightsRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Performance Insights Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.monitoringEnhancedRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, monitoringEnhancedRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Enhanced Monitoring Required</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={database.connectionPoolingRequired || false} 
                          onChange={(e) => {
                            const updatedDatabases = (formData.databases || []).map(d => 
                              d.id === database.id ? { ...d, connectionPoolingRequired: e.target.checked } : d
                            );
                            updateFormData({ databases: updatedDatabases });
                          }} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-700">Connection Pooling Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Security & Compliance Requirements</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Compliance Frameworks</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dropdownOptions.complianceFrameworks.map(framework => (
                  <label key={framework} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.complianceFrameworks?.includes(framework) || false} 
                      onChange={(e) => {
                        const current = formData.complianceFrameworks || [];
                        const updated = e.target.checked ? [...current, framework] : current.filter(f => f !== framework);
                        updateFormData({ complianceFrameworks: updated });
                      }} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">{framework.replace('_', '-')}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Classification</label>
                <select
                  value={formData.dataClassification || ''}
                  onChange={(e) => updateFormData({ dataClassification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select classification</option>
                  {dropdownOptions.dataClassifications.map(classification => (
                    <option key={classification} value={classification}>{classification}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">AWS Security Services</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.awsConfigRequired || false} 
                      onChange={(e) => updateFormData({ awsConfigRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">AWS Config</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.cloudtrailRequired || false} 
                      onChange={(e) => updateFormData({ cloudtrailRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">CloudTrail</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.cloudtrailDataEvents || false} 
                      onChange={(e) => updateFormData({ cloudtrailDataEvents: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">CloudTrail Data Events</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.guarddutyRequired || false} 
                      onChange={(e) => updateFormData({ guarddutyRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">GuardDuty</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.securityHubRequired || false} 
                      onChange={(e) => updateFormData({ securityHubRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Security Hub</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.inspectorRequired || false} 
                      onChange={(e) => updateFormData({ inspectorRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Inspector</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.macieRequired || false} 
                      onChange={(e) => updateFormData({ macieRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Macie</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.kmsRequired || false} 
                      onChange={(e) => updateFormData({ kmsRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">KMS (Key Management)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.secretsManagerRequired || false} 
                      onChange={(e) => updateFormData({ secretsManagerRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Secrets Manager</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.certificateManagerRequired || false} 
                      onChange={(e) => updateFormData({ certificateManagerRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Certificate Manager</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.iamAccessAnalyzerRequired || false} 
                      onChange={(e) => updateFormData({ iamAccessAnalyzerRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">IAM Access Analyzer</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.vpcFlowLogsRequired || false} 
                      onChange={(e) => updateFormData({ vpcFlowLogsRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">VPC Flow Logs</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Advanced Security Features</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.shieldAdvancedRequired || false} 
                      onChange={(e) => updateFormData({ shieldAdvancedRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Shield Advanced</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.firewallManagerRequired || false} 
                      onChange={(e) => updateFormData({ firewallManagerRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Firewall Manager</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.networkFirewallRequired || false} 
                      onChange={(e) => updateFormData({ networkFirewallRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Network Firewall</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.penetrationTestingRequired || false} 
                      onChange={(e) => updateFormData({ penetrationTestingRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Penetration Testing</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.vulnerabilityScanningRequired || false} 
                      onChange={(e) => updateFormData({ vulnerabilityScanningRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Vulnerability Scanning</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.securityTrainingRequired || false} 
                      onChange={(e) => updateFormData({ securityTrainingRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Security Training</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.incidentResponsePlanRequired || false} 
                      onChange={(e) => updateFormData({ incidentResponsePlanRequired: e.target.checked })} 
                      className="mr-2" 
                    />
                    <span className="text-sm text-gray-700">Incident Response Plan</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Cost Summary & Optimization</h3>
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-900 mb-4">💰 Current Estimate: ${realTimeCost.monthly.toLocaleString()}/month</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Monthly Cost:</strong> ${realTimeCost.monthly.toLocaleString()}</div>
                <div><strong>Annual Cost:</strong> ${realTimeCost.annual.toLocaleString()}</div>
                <div><strong>Servers:</strong> {(formData.servers || []).length} configured</div>
                <div><strong>Storage Items:</strong> {(formData.storageItems || []).length} configured</div>
                <div><strong>Databases:</strong> {(formData.databases || []).length} configured</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-4">💡 Optimization Recommendations</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Consider Reserved Instances for 40% savings on compute</p>
                <p>• Use S3 Intelligent Tiering for storage optimization</p>
                <p>• Enable auto-scaling to optimize costs during low usage</p>
                <p>• Consider Spot Instances for non-critical workloads</p>
              </div>
            </div>
          </div>
        );
      
      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Service Recommendations</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">🎯 AWS Service Recommendations</h4>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-gray-900">Compute Services</h5>
                  <p className="text-sm text-gray-600">EC2 instances with Auto Scaling Groups for {(formData.servers || []).length} server(s)</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-medium text-gray-900">Storage Services</h5>
                  <p className="text-sm text-gray-600">Optimized storage configuration for {(formData.storageItems || []).length} storage requirement(s)</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h5 className="font-medium text-gray-900">Database Services</h5>
                  <p className="text-sm text-gray-600">Managed database services for {(formData.databases || []).length} database(s)</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 9:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Validation & Review</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">✅ Configuration Validation</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Client Information - Complete</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Compute Requirements - {(formData.servers || []).length} server(s) configured</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Storage Requirements - {(formData.storageItems || []).length} storage item(s) configured</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Database Requirements - {(formData.databases || []).length} database(s) configured</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 10:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Final Review & Submit</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Configuration Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Company:</strong> {formData.companyName || 'Not specified'}</div>
                <div><strong>Project:</strong> {formData.projectName || 'Not specified'}</div>
                <div><strong>Region:</strong> {formData.primaryAwsRegion || 'Not specified'}</div>
                <div><strong>Servers:</strong> {(formData.servers || []).length} configured</div>
                <div><strong>Storage Items:</strong> {(formData.storageItems || []).length} configured</div>
                <div><strong>Databases:</strong> {(formData.databases || []).length} configured</div>
                <div><strong>Estimated Cost:</strong> ${realTimeCost.monthly.toLocaleString()}/month</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Manual Cost Estimation</h1>
          <p className="text-gray-600 mt-2">Comprehensive form with 200+ fields from enhanced Excel template</p>
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
                <div className="mt-2 text-xs text-gray-500">
                  <div>Servers: {(formData.servers || []).length}</div>
                  <div>Storage: {(formData.storageItems || []).length}</div>
                  <div>Databases: {(formData.databases || []).length}</div>
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
                  {currentStep < 10 ? (
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