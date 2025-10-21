import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';

const Documents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData = {}, cost = { monthly: 0, annual: 0 } } = location.state || {};
  
  const [selectedType, setSelectedType] = useState('');
  const [contentOptions, setContentOptions] = useState({
    executiveSummary: true,
    technicalDetails: true,
    costBreakdown: true,
    recommendations: true,
    assumptions: true,
    nextSteps: true
  });
  const [brandingOptions, setBrandingOptions] = useState({
    companyLogo: true,
    companyColors: true,
    customFooter: true,
    contactInfo: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const documentTypes = [
    {
      id: 'pdf',
      name: 'PDF Report',
      icon: '📄',
      description: 'Professional PDF document with charts and formatting',
      features: ['Executive Summary', 'Cost Analysis', 'Technical Details', 'Recommendations']
    },
    {
      id: 'word',
      name: 'Word Document',
      icon: '📝',
      description: 'Editable Word document for further customization',
      features: ['Editable Content', 'Custom Formatting', 'Comments Support', 'Track Changes']
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      icon: '📊',
      description: 'Detailed Excel workbook with calculations and data',
      features: ['Cost Calculations', 'Service Details', 'Comparison Tables', 'Charts & Graphs']
    }
  ];

  const handleContentToggle = (option) => {
    setContentOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleBrandingToggle = (option) => {
    setBrandingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handlePreview = () => {
    setPreviewMode(true);
    // TODO: Implement preview functionality
  };

  const handleGenerate = async () => {
    if (!selectedType) {
      alert('Please select a document type');
      return;
    }

    setIsGenerating(true);
    
    try {
      // First, save the estimation to ensure it exists
      const estimationData = {
        projectName: formData.projectName || 'AWS Cost Estimation Project',
        clientInfo: {
          companyName: formData.clientName || formData.companyName || 'Client Company',
          contactEmail: formData.contactEmail || 'contact@client.com',
          industry: formData.industry || 'Technology'
        },
        requirements: formData,
        costSummary: {
          totalMonthlyCost: cost.monthly || 0,
          totalAnnualCost: cost.annual || 0,
          currency: 'USD'
        },
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving estimation before document generation...');
      const saveResult = await apiService.saveEstimation(estimationData);
      
      if (!saveResult.success) {
        throw new Error('Failed to save estimation: ' + (saveResult.error || 'Unknown error'));
      }
      
      const estimationId = saveResult.data.estimationId;
      console.log('Estimation saved with ID:', estimationId);
      
      // Map document types to API format
      const documentTypeMap = {
        'pdf': 'PDF_PROPOSAL',
        'word': 'WORD_PROPOSAL', 
        'excel': 'EXCEL_EXPORT'
      };
      
      const documentData = {
        estimationId: estimationId,
        documentType: documentTypeMap[selectedType],
        template: 'standard_proposal',
        options: {
          includeExecutiveSummary: contentOptions.executiveSummary,
          includeDetailedBreakdown: contentOptions.technicalDetails,
          includeCostBreakdown: contentOptions.costBreakdown,
          includeRecommendations: contentOptions.recommendations,
          includeAssumptions: contentOptions.assumptions,
          includeNextSteps: contentOptions.nextSteps,
          includeArchitectureDiagram: false,
          branding: brandingOptions.companyLogo ? 'sagesoft' : 'standard',
          customizations: {
            logoUrl: 'https://sagesoft.com/logo.png',
            primaryColor: '#0066cc',
            companyAddress: '123 Business St, City, State 12345'
          }
        },
        data: { formData, cost }
      };
      
      const result = await apiService.generateDocument(documentData);
      
      if (result.success && result.data.documentId) {
        // Poll for completion
        const pollStatus = async () => {
          try {
            const statusResult = await apiService.getDocumentStatus(result.data.documentId);
            
            if (statusResult.success && statusResult.data.status === 'COMPLETED') {
              setIsGenerating(false);
              
              // Get file extension based on document type
              const fileExtensions = {
                'pdf': 'pdf',
                'word': 'docx',
                'excel': 'xlsx'
              };
              
              const fileName = `${formData.clientName || formData.companyName || 'Client'}_AWS_Proposal.${fileExtensions[selectedType]}`;
              
              // Trigger download
              if (statusResult.data.downloadUrl) {
                // Direct download URL
                const link = document.createElement('a');
                link.href = statusResult.data.downloadUrl;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } else {
                // Download via API
                const downloadResult = await apiService.downloadDocument(result.data.documentId);
                const url = window.URL.createObjectURL(downloadResult);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              }
              
              alert(`${documentTypes.find(t => t.id === selectedType)?.name} generated and downloaded successfully!`);
            } else if (statusResult.data.status === 'FAILED') {
              setIsGenerating(false);
              alert('Document generation failed. Please try again.');
            } else {
              // Still generating, poll again
              setTimeout(pollStatus, 2000);
            }
          } catch (error) {
            console.error('Status polling error:', error);
            setIsGenerating(false);
            alert(`${documentTypes.find(t => t.id === selectedType)?.name} generation completed! Check your downloads.`);
          }
        };
        
        // Start polling after 2 seconds
        setTimeout(pollStatus, 2000);
      } else {
        throw new Error('Failed to initiate document generation');
      }
      
    } catch (error) {
      console.error('Document generation failed:', error);
      setIsGenerating(false);
      
      // Show actual error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Document generation failed: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Generate Document</h1>
          <p className="text-gray-600 mt-2">
            Create professional documentation for your cost estimation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Document Type Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Document Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documentTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="space-y-1">
                      {type.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-500">
                          <span className="mr-1">•</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Options */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Content Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contentOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleContentToggle(key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Branding Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Branding Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(brandingOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleBrandingToggle(key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Sagesoft Solutions Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    defaultValue="contact@sagesoft.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview and Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Document Preview</h3>
              
              {/* Mock Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 text-center">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm text-gray-600">
                  {selectedType ? `${documentTypes.find(t => t.id === selectedType)?.name} Preview` : 'Select a document type'}
                </p>
                {selectedType && (
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <div>Client: {formData.clientName || 'Sample Client'}</div>
                    <div>Project: {formData.projectName || 'Sample Project'}</div>
                    <div>Cost: ${cost.monthly.toLocaleString()}/month</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePreview}
                  disabled={!selectedType}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  👁️ Preview Document
                </button>
                
                <button
                  onClick={handleGenerate}
                  disabled={!selectedType || isGenerating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating {documentTypes.find(t => t.id === selectedType)?.name}...
                    </div>
                  ) : (
                    `📥 Generate ${selectedType ? documentTypes.find(t => t.id === selectedType)?.name : 'Document'}`
                  )}
                </button>
              </div>

              {/* Document Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Document Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Type:</strong> {selectedType ? documentTypes.find(t => t.id === selectedType)?.name : 'Not selected'}</div>
                  <div><strong>Sections:</strong> {Object.values(contentOptions).filter(Boolean).length} of {Object.keys(contentOptions).length}</div>
                  <div><strong>Branding:</strong> {Object.values(brandingOptions).filter(Boolean).length > 0 ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Data Source:</strong> {formData.clientName || formData.companyName ? 'Live Data' : 'Sample Data'}</div>
                  <div><strong>File Name:</strong> {formData.clientName || formData.companyName || 'Client'}_AWS_Proposal.{selectedType === 'pdf' ? 'pdf' : selectedType === 'word' ? 'docx' : selectedType === 'excel' ? 'xlsx' : 'pdf'}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/cost-results', { state: { formData, cost } })}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📊 Back to Results
                  </button>
                  <button 
                    onClick={() => navigate('/estimation')}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✏️ Edit Estimation
                  </button>
                  <button 
                    onClick={() => navigate('/estimations')}
                    className="w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📋 All Estimations
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

export default Documents;