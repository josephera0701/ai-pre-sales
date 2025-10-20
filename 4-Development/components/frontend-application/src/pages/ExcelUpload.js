import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ExcelUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Mock validation results
  const mockValidation = {
    clientInfo: { status: 'valid', message: 'Valid' },
    computeRequirements: { status: 'valid', message: 'Valid (3 servers)' },
    storageRequirements: { status: 'valid', message: 'Valid (2 types)' },
    databaseRequirements: { status: 'warning', message: 'Warning (see details)' },
    securityCompliance: { status: 'valid', message: 'Valid' }
  };

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

  const handleFile = (file) => {
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
    
    // Simulate validation process
    setTimeout(() => {
      setValidationResults(mockValidation);
      setIsValidating(false);
    }, 2000);
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📋 Validation Results</h3>
            <div className="space-y-4">
              {Object.entries(validationResults).map(([key, result]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
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
              ))}
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View Details
              </button>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                Fix Issues
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {validationResults && (
          <div className="flex justify-between">
            <button
              onClick={() => {
                setUploadedFile(null);
                setValidationResults(null);
              }}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={() => navigate('/estimation')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;