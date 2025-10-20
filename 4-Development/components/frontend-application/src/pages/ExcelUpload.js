import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const ExcelUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [realTimeCost, setRealTimeCost] = useState({ monthly: 0, annual: 0 });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Real-time cost calculation matching Manual Entry approach
  const calculateRealTimeCost = useCallback(async (currentFormData) => {
    if (!currentFormData.ec2Instances && !currentFormData.storageSize && !currentFormData.rdsInstances) {
      setRealTimeCost({ monthly: 0, annual: 0 });
      return;
    }

    try {
      const requirements = {
        compute: currentFormData.ec2Instances ? [{
          service: 'EC2',
          instanceType: currentFormData.instanceType || 't3.medium',
          quantity: currentFormData.ec2Instances,
          hoursPerMonth: 730
        }] : [],
        storage: currentFormData.storageSize ? [{
          service: 'EBS',
          storageType: currentFormData.storageType || 'gp3',
          sizeGB: currentFormData.storageSize
        }] : [],
        database: currentFormData.databaseRequired === 'rds' ? [{
          service: 'RDS',
          instanceType: currentFormData.rdsInstanceClass || 'db.t3.micro',
          storageGB: 100
        }] : [],
        network: {
          dataTransferGB: 100,
          requests: 1000000
        }
      };

      const result = await apiService.calculateCost({ requirements, region: currentFormData.region || 'us-east-1' });
      
      if (result.data) {
        setRealTimeCost({
          monthly: Math.round(result.data.totalMonthlyCost || 0),
          annual: Math.round(result.data.totalAnnualCost || 0)
        });
      }
    } catch (error) {
      console.error('Cost calculation failed:', error);
      // Fallback to basic calculation
      let monthly = 0;
      if (currentFormData.ec2Instances && currentFormData.instanceType) {
        const instanceCosts = { 't3.micro': 8.5, 't3.small': 17, 't3.medium': 34, 'm5.large': 70, 'm5.xlarge': 140 };
        monthly += (currentFormData.ec2Instances || 0) * (instanceCosts[currentFormData.instanceType] || 0);
      }
      if (currentFormData.storageSize) monthly += currentFormData.storageSize * 0.10;
      setRealTimeCost({ monthly: Math.round(monthly), annual: Math.round(monthly * 12) });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => calculateRealTimeCost(formData), 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, calculateRealTimeCost]);

  const handleFile = async (file) => {
    // Validate file type and size
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsValidating(true);
    
    try {
      // Upload file to backend
      const uploadResult = await apiService.uploadExcel(file);
      
      // Validate the uploaded file
      const validationResult = await apiService.validateExcel(uploadResult.uploadId);
      
      // Parse the validation results to match Manual Entry structure
      const parsed = validationResult.parsedData || {};
      setParsedData(parsed);
      
      // Convert parsed data to form data structure
      const convertedFormData = {
        clientName: parsed.clientName || '',
        projectName: parsed.projectName || '',
        region: parsed.region || 'us-east-1',
        contactEmail: parsed.contactEmail || '',
        ec2Instances: parsed.ec2Instances || 0,
        instanceType: parsed.instanceType || '',
        operatingSystem: parsed.operatingSystem || '',
        loadBalancer: parsed.loadBalancer || '',
        storageSize: parsed.storageSize || 0,
        storageType: parsed.storageType || '',
        s3Required: parsed.s3Required || '',
        backupRequired: parsed.backupRequired || '',
        vpcConfig: parsed.vpcConfig || '',
        internetGateway: parsed.internetGateway || '',
        natGateway: parsed.natGateway || '',
        cloudfront: parsed.cloudfront || '',
        databaseRequired: parsed.databaseRequired || '',
        rdsEngine: parsed.rdsEngine || '',
        rdsInstanceClass: parsed.rdsInstanceClass || '',
        multiAZ: parsed.multiAZ || '',
        sslCertificate: parsed.sslCertificate || '',
        wafProtection: parsed.wafProtection || '',
        encryptionAtRest: parsed.encryptionAtRest || '',
        compliance: parsed.compliance || ''
      };
      
      setFormData(convertedFormData);
      
      // Create comprehensive validation results matching Manual Entry categories
      setValidationResults({
        clientInfo: { 
          status: (parsed.clientName && parsed.projectName) ? 'valid' : 'warning', 
          message: (parsed.clientName && parsed.projectName) ? 'Client and project info complete' : 'Missing client or project name',
          details: {
            clientName: parsed.clientName || 'Not specified',
            projectName: parsed.projectName || 'Not specified',
            region: parsed.region || 'us-east-1',
            contactEmail: parsed.contactEmail || 'Not specified'
          }
        },
        computeRequirements: { 
          status: parsed.ec2Instances > 0 ? 'valid' : 'error', 
          message: parsed.ec2Instances > 0 ? `${parsed.ec2Instances} instances configured` : 'No compute instances specified',
          details: {
            ec2Instances: parsed.ec2Instances || 0,
            instanceType: parsed.instanceType || 'Not specified',
            operatingSystem: parsed.operatingSystem || 'Not specified',
            loadBalancer: parsed.loadBalancer || 'Not specified'
          }
        },
        storageRequirements: { 
          status: parsed.storageSize > 0 ? 'valid' : 'warning', 
          message: parsed.storageSize > 0 ? `${parsed.storageSize} GB storage configured` : 'No storage specified',
          details: {
            storageSize: parsed.storageSize || 0,
            storageType: parsed.storageType || 'Not specified',
            s3Required: parsed.s3Required || 'Not specified',
            backupRequired: parsed.backupRequired || 'Not specified'
          }
        },
        networkRequirements: {
          status: 'valid',
          message: 'Network configuration available',
          details: {
            vpcConfig: parsed.vpcConfig || 'Not specified',
            internetGateway: parsed.internetGateway || 'Not specified',
            natGateway: parsed.natGateway || 'Not specified',
            cloudfront: parsed.cloudfront || 'Not specified'
          }
        },
        databaseRequirements: { 
          status: parsed.databaseRequired ? 'valid' : 'warning', 
          message: parsed.databaseRequired ? `Database: ${parsed.databaseRequired}` : 'No database specified',
          details: {
            databaseRequired: parsed.databaseRequired || 'Not specified',
            rdsEngine: parsed.rdsEngine || 'Not specified',
            rdsInstanceClass: parsed.rdsInstanceClass || 'Not specified',
            multiAZ: parsed.multiAZ || 'Not specified'
          }
        },
        securityCompliance: { 
          status: 'valid', 
          message: 'Security configuration available',
          details: {
            sslCertificate: parsed.sslCertificate || 'Not specified',
            wafProtection: parsed.wafProtection || 'Not specified',
            encryptionAtRest: parsed.encryptionAtRest || 'Not specified',
            compliance: parsed.compliance || 'Not specified'
          }
        }
      });
      
      setIsValidating(false);
    } catch (error) {
      console.error('File upload/validation failed:', error);
      // Fallback validation results
      setValidationResults({
        clientInfo: { status: 'error', message: 'Failed to parse client info', details: {} },
        computeRequirements: { status: 'error', message: 'Failed to parse compute requirements', details: {} },
        storageRequirements: { status: 'error', message: 'Failed to parse storage requirements', details: {} },
        networkRequirements: { status: 'error', message: 'Failed to parse network requirements', details: {} },
        databaseRequirements: { status: 'error', message: 'Failed to parse database requirements', details: {} },
        securityCompliance: { status: 'error', message: 'Failed to parse security requirements', details: {} }
      });
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/new-estimation')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Input Selection
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Excel Upload</h1>
          <p className="text-gray-600 mt-2">Step 1: Upload Excel Template</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drag & Drop Excel File Here
            </h3>
            <p className="text-gray-600 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: .xlsx, .xls (Max 10MB)
            </p>
          </div>
        </div>

        {/* File Info */}
        {uploadedFile && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded File</h3>
            <div className="flex items-center space-x-4">
              <div className="text-2xl">📄</div>
              <div>
                <div className="font-medium text-gray-900">{uploadedFile.name}</div>
                <div className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {isValidating && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Validating File...</h3>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processing your file...</span>
            </div>
          </div>
        )}

        {validationResults && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">📋 Validation Results</h3>
              {realTimeCost.monthly > 0 && (
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${realTimeCost.monthly.toLocaleString()}/mo
                  </div>
                  <div className="text-sm text-gray-600">
                    ${realTimeCost.annual.toLocaleString()}/year
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {Object.entries(validationResults).map(([key, result]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getStatusIcon(result.status)}</span>
                      <span className="font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                    <span className={`font-medium ${getStatusColor(result.status)}`}>
                      {result.message}
                    </span>
                  </div>
                  
                  {showDetails && result.details && (
                    <div className="mt-3 pl-8 space-y-1 text-sm text-gray-600">
                      {Object.entries(result.details).map(([detailKey, detailValue]) => (
                        <div key={detailKey} className="flex justify-between">
                          <span className="capitalize">{detailKey.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium">{detailValue || 'Not specified'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showDetails ? 'Hide Details' : 'View Details'}
              </button>
              <button 
                onClick={() => setEditMode(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Edit Configuration
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode - Detailed Form */}
        {editMode && validationResults && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">✏️ Edit Configuration</h3>
              <button 
                onClick={() => setEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Client Information</h4>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Project Name"
                  value={formData.projectName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.region || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
              
              {/* Compute */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Compute Requirements</h4>
                <input
                  type="number"
                  placeholder="Number of EC2 Instances"
                  value={formData.ec2Instances || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ec2Instances: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.instanceType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instanceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select instance type</option>
                  <option value="t3.micro">t3.micro (1 vCPU, 1 GB RAM)</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GB RAM)</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GB RAM)</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GB RAM)</option>
                  <option value="m5.xlarge">m5.xlarge (4 vCPU, 16 GB RAM)</option>
                </select>
              </div>
              
              {/* Storage */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Storage Requirements</h4>
                <input
                  type="number"
                  placeholder="Storage Size (GB)"
                  value={formData.storageSize || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, storageSize: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.storageType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, storageType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select storage type</option>
                  <option value="gp3">General Purpose SSD (gp3)</option>
                  <option value="gp2">General Purpose SSD (gp2)</option>
                  <option value="io2">Provisioned IOPS SSD (io2)</option>
                </select>
              </div>
              
              {/* Database */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Database Requirements</h4>
                <select
                  value={formData.databaseRequired || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, databaseRequired: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select database option</option>
                  <option value="no">No Database</option>
                  <option value="rds">Amazon RDS</option>
                  <option value="dynamodb">Amazon DynamoDB</option>
                </select>
                {(formData.databaseRequired === 'rds') && (
                  <select
                    value={formData.rdsInstanceClass || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, rdsInstanceClass: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select RDS instance class</option>
                    <option value="db.t3.micro">db.t3.micro</option>
                    <option value="db.t3.small">db.t3.small</option>
                    <option value="db.t3.medium">db.t3.medium</option>
                  </select>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update validation results based on edited form data
                  setValidationResults(prev => ({
                    ...prev,
                    clientInfo: {
                      ...prev.clientInfo,
                      status: (formData.clientName && formData.projectName) ? 'valid' : 'warning',
                      message: (formData.clientName && formData.projectName) ? 'Client and project info complete' : 'Missing client or project name'
                    },
                    computeRequirements: {
                      ...prev.computeRequirements,
                      status: formData.ec2Instances > 0 ? 'valid' : 'error',
                      message: formData.ec2Instances > 0 ? `${formData.ec2Instances} instances configured` : 'No compute instances specified'
                    }
                  }));
                  setEditMode(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {validationResults && !editMode && (
          <div className="flex justify-between">
            <button
              onClick={() => {
                setUploadedFile(null);
                setValidationResults(null);
                setParsedData(null);
                setFormData({});
                setRealTimeCost({ monthly: 0, annual: 0 });
                setShowDetails(false);
              }}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Start Over
            </button>
            <div className="flex space-x-4">
              <button
                onClick={async () => {
                  try {
                    // Save as draft using the parsed/edited form data
                    const estimationData = {
                      projectName: formData.projectName || 'Excel Import Project',
                      description: 'Imported from Excel template',
                      inputMethod: 'EXCEL_UPLOAD',
                      clientInfo: {
                        companyName: formData.clientName || 'Unknown Client',
                        industry: 'Technology',
                        primaryContact: formData.contactName || '',
                        email: formData.contactEmail || '',
                        regionPreference: [formData.region || 'us-east-1']
                      },
                      requirements: formData
                    };
                    
                    const result = await apiService.createEstimation(estimationData);
                    alert(`Draft saved successfully! Estimation ID: ${result.data.estimationId}`);
                  } catch (error) {
                    console.error('Save draft failed:', error);
                    alert('Failed to save draft. Please try again.');
                  }
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => {
                  // Navigate to cost results with the parsed form data
                  navigate('/cost-results', { 
                    state: { 
                      formData, 
                      cost: realTimeCost,
                      source: 'excel-upload'
                    } 
                  });
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Estimation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;