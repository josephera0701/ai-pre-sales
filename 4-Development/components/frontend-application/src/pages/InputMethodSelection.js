import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const InputMethodSelection = () => {
  const navigate = useNavigate();

  const handleExcelUpload = () => {
    navigate('/excel-upload');
  };

  const handleManualEntry = () => {
    navigate('/estimation');
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiService.downloadExcelTemplate();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AWS_Cost_Estimation_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="nav-link mb-6 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-xl transition-all duration-200"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Choose Input Method</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">How would you like to provide the requirements?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-8 card-hover group border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl text-white">📄</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Excel Upload</h2>
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Upload our standardized Excel template with client requirements already filled out.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>Faster for existing client data</span>
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>Bulk import of multiple servers</span>
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>Validation and error checking</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExcelUpload}
            className="btn-primary w-full"
          >
            Choose Excel Upload
          </button>
        </div>

        <div className="card p-8 card-hover group border-2 border-transparent hover:border-green-500 dark:hover:border-green-400">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-4xl text-white">✏️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Manual Entry</h2>
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Fill out requirements using our guided step-by-step form interface.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>No file preparation needed</span>
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>Real-time cost calculations</span>
              </div>
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                </div>
                <span>Built-in help and guidance</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleManualEntry}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Choose Manual Entry
          </button>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary inline-flex items-center"
        >
          <span className="mr-2">📥</span>
          Download Excel Template
        </button>
      </div>
    </div>
  );
};

export default InputMethodSelection;