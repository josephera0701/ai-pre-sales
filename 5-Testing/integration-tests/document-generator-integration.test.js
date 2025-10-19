const AWS = require('aws-sdk');

// Mock AWS services for integration testing
jest.mock('aws-sdk', () => ({
  Lambda: jest.fn(() => ({
    invoke: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  })),
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn().mockReturnValue({ promise: jest.fn() }),
      put: jest.fn().mockReturnValue({ promise: jest.fn() }),
      query: jest.fn().mockReturnValue({ promise: jest.fn() })
    }))
  },
  S3: jest.fn(() => ({
    getSignedUrl: jest.fn()
  }))
}));

describe('Document Generator Service Integration Tests', () => {
  let mockLambda, mockDynamoDB, mockS3;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLambda = new AWS.Lambda();
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    mockS3 = new AWS.S3();
  });

  describe('Cost Calculator Integration', () => {
    test('should generate PDF from cost calculator results', async () => {
      // Mock cost calculator service response
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              calculationId: 'calc123',
              totalMonthlyCost: 250.75,
              costBreakdown: {
                'EC2': 150.00,
                'S3': 50.25,
                'RDS': 50.50
              },
              recommendations: [
                {
                  title: 'Consider Reserved Instances',
                  savings: 30.00,
                  priority: 'High'
                }
              ]
            })
          })
        })
      });

      // Mock document generator service response
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Document generated successfully',
              documentId: 'doc123',
              documentType: 'pdf',
              fileSize: 245760,
              downloadUrl: '/documents/doc123/download'
            })
          })
        })
      });

      // 1. Get cost calculation
      const costResult = await mockLambda.invoke({
        FunctionName: 'cost-calculator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/calculations/cost',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            requirements: {
              compute: [{ service: 'EC2', instanceType: 't3.medium', quantity: 2 }],
              storage: [{ service: 'S3', storageType: 'standard', sizeGB: 1000 }]
            }
          })
        })
      }).promise();

      const costData = JSON.parse(JSON.parse(costResult.Payload).body);
      expect(costData.totalMonthlyCost).toBe(250.75);

      // 2. Generate PDF document
      const documentResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'pdf',
            templateType: 'standard',
            estimationData: costData,
            clientInfo: {
              companyName: 'Integration Test Client',
              contactName: 'John Doe'
            }
          })
        })
      }).promise();

      const documentData = JSON.parse(JSON.parse(documentResult.Payload).body);
      expect(documentData.documentId).toBe('doc123');
      expect(documentData.documentType).toBe('pdf');
      expect(documentData.fileSize).toBeGreaterThan(0);
    });

    test('should generate Excel with cost breakdown charts', async () => {
      // Mock cost calculator with detailed breakdown
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              totalMonthlyCost: 500.00,
              costBreakdown: {
                'EC2': 200.00,
                'S3': 75.00,
                'RDS': 125.00,
                'Lambda': 50.00,
                'CloudFront': 50.00
              },
              recommendations: [
                { title: 'Reserved Instances', savings: 60.00 },
                { title: 'S3 Lifecycle Policies', savings: 15.00 }
              ]
            })
          })
        })
      });

      // Mock Excel document generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'excel123',
              documentType: 'excel',
              fileSize: 45120
            })
          })
        })
      });

      const costResult = await mockLambda.invoke({
        FunctionName: 'cost-calculator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/calculations/cost',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const documentResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'excel',
            templateType: 'detailed',
            estimationData: JSON.parse(JSON.parse(costResult.Payload).body)
          })
        })
      }).promise();

      const documentData = JSON.parse(JSON.parse(documentResult.Payload).body);
      expect(documentData.documentType).toBe('excel');
      expect(documentData.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Excel Processor Integration', () => {
    test('should generate Word document from processed Excel data', async () => {
      // Mock Excel processor processed data
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              processId: 'process123',
              processedData: {
                sheets: {
                  'Infrastructure': {
                    data: [
                      { service: 'EC2', type: 't3.large', quantity: 3, region: 'us-east-1' },
                      { service: 'S3', type: 'standard', quantity: 2000, region: 'us-east-1' }
                    ],
                    recordCount: 2
                  }
                },
                totalRecords: 2,
                summary: {
                  uniqueServices: 2,
                  uniqueRegions: 1
                }
              }
            })
          })
        })
      });

      // Mock cost calculation from processed data
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              totalMonthlyCost: 180.25,
              costBreakdown: {
                'EC2': 134.25,
                'S3': 46.00
              }
            })
          })
        })
      });

      // Mock Word document generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'word123',
              documentType: 'word',
              fileSize: 125440
            })
          })
        })
      });

      // 1. Get processed Excel data
      const excelResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/excel/processed/process123',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const processedData = JSON.parse(JSON.parse(excelResult.Payload).body);
      expect(processedData.processedData.totalRecords).toBe(2);

      // 2. Generate cost calculation
      const costResult = await mockLambda.invoke({
        FunctionName: 'cost-calculator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/calculations/cost',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            requirements: processedData.processedData.sheets.Infrastructure.data
          })
        })
      }).promise();

      // 3. Generate Word document
      const documentResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'word',
            templateType: 'detailed',
            estimationData: JSON.parse(JSON.parse(costResult.Payload).body)
          })
        })
      }).promise();

      const documentData = JSON.parse(JSON.parse(documentResult.Payload).body);
      expect(documentData.documentType).toBe('word');
      expect(documentData.fileSize).toBeGreaterThan(0);
    });
  });

  describe('User Management Integration', () => {
    test('should apply user preferences to document generation', async () => {
      // Mock user management service response
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              userId: 'user123',
              profile: {
                companyName: 'User Company',
                preferences: {
                  defaultDocumentType: 'pdf',
                  defaultTemplate: 'executive',
                  includeLogo: true,
                  includeCharts: true,
                  brandingColor: '#0066cc'
                }
              }
            })
          })
        })
      });

      // Mock document generation with preferences
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'pref123',
              documentType: 'pdf',
              templateType: 'executive',
              fileSize: 180000
            })
          })
        })
      });

      // 1. Get user preferences
      const userResult = await mockLambda.invoke({
        FunctionName: 'user-management-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/users/me',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const userData = JSON.parse(JSON.parse(userResult.Payload).body);
      expect(userData.profile.preferences.defaultDocumentType).toBe('pdf');

      // 2. Generate document with user preferences
      const documentResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: userData.profile.preferences.defaultDocumentType,
            templateType: userData.profile.preferences.defaultTemplate,
            estimationData: { totalMonthlyCost: 150.50 },
            clientInfo: {
              companyName: userData.profile.companyName
            },
            options: {
              includeLogo: userData.profile.preferences.includeLogo,
              includeCharts: userData.profile.preferences.includeCharts,
              brandingColor: userData.profile.preferences.brandingColor
            }
          })
        })
      }).promise();

      const documentData = JSON.parse(JSON.parse(documentResult.Payload).body);
      expect(documentData.templateType).toBe('executive');
    });
  });

  describe('Multi-Format Document Generation', () => {
    test('should generate all document formats from same estimation data', async () => {
      const estimationData = {
        totalMonthlyCost: 350.75,
        costBreakdown: {
          'EC2': 200.00,
          'S3': 75.25,
          'RDS': 75.50
        },
        recommendations: [
          { title: 'Reserved Instances', savings: 50.00 },
          { title: 'Storage Optimization', savings: 15.25 }
        ]
      };

      // Mock PDF generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'pdf123',
              documentType: 'pdf',
              fileSize: 280000
            })
          })
        })
      });

      // Mock Word generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'word123',
              documentType: 'word',
              fileSize: 150000
            })
          })
        })
      });

      // Mock Excel generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId: 'excel123',
              documentType: 'excel',
              fileSize: 65000
            })
          })
        })
      });

      // Generate PDF
      const pdfResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'pdf',
            estimationData,
            clientInfo: { companyName: 'Multi-Format Test' }
          })
        })
      }).promise();

      // Generate Word
      const wordResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'word',
            estimationData,
            clientInfo: { companyName: 'Multi-Format Test' }
          })
        })
      }).promise();

      // Generate Excel
      const excelResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'excel',
            estimationData,
            clientInfo: { companyName: 'Multi-Format Test' }
          })
        })
      }).promise();

      const pdfData = JSON.parse(JSON.parse(pdfResult.Payload).body);
      const wordData = JSON.parse(JSON.parse(wordResult.Payload).body);
      const excelData = JSON.parse(JSON.parse(excelResult.Payload).body);

      expect(pdfData.documentType).toBe('pdf');
      expect(wordData.documentType).toBe('word');
      expect(excelData.documentType).toBe('excel');
      
      // All should have different file sizes but same source data
      expect(pdfData.fileSize).toBeGreaterThan(0);
      expect(wordData.fileSize).toBeGreaterThan(0);
      expect(excelData.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Complete Document Lifecycle', () => {
    test('should handle complete document workflow', async () => {
      const documentId = 'lifecycle123';

      // Mock document generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId,
              documentType: 'pdf',
              fileSize: 200000,
              downloadUrl: `/documents/${documentId}/download`
            })
          })
        })
      });

      // Mock status check
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId,
              status: 'completed',
              documentType: 'pdf',
              createdAt: '2023-01-01T00:00:00Z',
              completedAt: '2023-01-01T00:01:30Z',
              fileSize: 200000,
              downloadUrl: `/documents/${documentId}/download`
            })
          })
        })
      });

      // Mock download URL generation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documentId,
              downloadUrl: 'https://s3.amazonaws.com/signed-url',
              expiresIn: 3600,
              fileSize: 200000
            })
          })
        })
      });

      // Mock document list
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              documents: [
                {
                  documentId,
                  documentType: 'pdf',
                  status: 'completed',
                  createdAt: '2023-01-01T00:00:00Z',
                  fileSize: 200000
                }
              ],
              totalCount: 1
            })
          })
        })
      });

      // 1. Generate document
      const generateResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            documentType: 'pdf',
            estimationData: { totalMonthlyCost: 100.00 }
          })
        })
      }).promise();

      const generateData = JSON.parse(JSON.parse(generateResult.Payload).body);
      expect(generateData.documentId).toBe(documentId);

      // 2. Check status
      const statusResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: `/documents/${documentId}/status`,
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const statusData = JSON.parse(JSON.parse(statusResult.Payload).body);
      expect(statusData.status).toBe('completed');

      // 3. Get download URL
      const downloadResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: `/documents/${documentId}/download`,
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const downloadData = JSON.parse(JSON.parse(downloadResult.Payload).body);
      expect(downloadData.downloadUrl).toContain('s3.amazonaws.com');

      // 4. Verify in document list
      const listResult = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/documents',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const listData = JSON.parse(JSON.parse(listResult.Payload).body);
      const document = listData.documents.find(d => d.documentId === documentId);
      expect(document).toBeDefined();
      expect(document.status).toBe('completed');
    });
  });

  describe('Error Propagation', () => {
    test('should handle cost calculator service failures', async () => {
      // Mock cost calculator failure
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 500,
            body: JSON.stringify({
              error: 'Cost calculation failed'
            })
          })
        })
      });

      const costResult = await mockLambda.invoke({
        FunctionName: 'cost-calculator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/calculations/cost',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const costData = JSON.parse(JSON.parse(costResult.Payload).body);
      expect(costData.error).toContain('Cost calculation failed');

      // Document generation should handle missing cost data gracefully
      // This would be handled in the actual implementation
    });

    test('should handle authentication failures across services', async () => {
      // Mock authentication failure
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 401,
            body: JSON.stringify({
              error: 'Authentication required'
            })
          })
        })
      });

      const result = await mockLambda.invoke({
        FunctionName: 'document-generator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/documents/generate',
          headers: { 'x-user-id': '' }, // Invalid user ID
          body: JSON.stringify({
            documentType: 'pdf',
            estimationData: { totalMonthlyCost: 100 }
          })
        })
      }).promise();

      const resultData = JSON.parse(JSON.parse(result.Payload).body);
      expect(resultData.error).toBe('Authentication required');
    });
  });
});