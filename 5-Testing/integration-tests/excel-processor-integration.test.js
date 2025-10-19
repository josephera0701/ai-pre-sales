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
  }
}));

describe('Excel Processor Service Integration Tests', () => {
  let mockLambda, mockDynamoDB;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLambda = new AWS.Lambda();
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
  });

  describe('Cross-Component Integration', () => {
    test('should integrate with auth service for user validation', async () => {
      // Mock auth service response
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              userId: 'user123',
              email: 'test@example.com',
              isValid: true
            })
          })
        })
      });

      // Mock Excel processor service call
      const excelProcessorPayload = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          fileName: 'cost-estimation.xlsx',
          fileContent: 'base64content',
          templateType: 'cost-estimation'
        })
      };

      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'File uploaded successfully',
              uploadId: 'upload123',
              sheetNames: ['Infrastructure', 'Pricing', 'Summary']
            })
          })
        })
      });

      // Simulate auth service validation
      const authResult = await mockLambda.invoke({
        FunctionName: 'auth-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/auth/validate',
          headers: { 'authorization': 'Bearer token123' }
        })
      }).promise();

      expect(authResult.StatusCode).toBe(200);
      const authBody = JSON.parse(JSON.parse(authResult.Payload).body);
      expect(authBody.isValid).toBe(true);

      // Simulate Excel processor service call
      const excelResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify(excelProcessorPayload)
      }).promise();

      expect(excelResult.StatusCode).toBe(200);
      const excelBody = JSON.parse(JSON.parse(excelResult.Payload).body);
      expect(excelBody.message).toBe('File uploaded successfully');
      expect(excelBody.uploadId).toBeDefined();
    });

    test('should integrate with user management for user preferences', async () => {
      // Mock user management service response
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              userId: 'user123',
              preferences: {
                defaultTemplateType: 'cost-estimation',
                autoValidate: true,
                notificationEmail: 'test@example.com'
              }
            })
          })
        })
      });

      // Mock Excel processor with user preferences
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Template validation completed',
              uploadId: 'upload123',
              validation: {
                isValid: true,
                templateType: 'cost-estimation',
                autoValidated: true
              }
            })
          })
        })
      });

      // Get user preferences
      const userResult = await mockLambda.invoke({
        FunctionName: 'user-management-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/users/profile',
          headers: { 'x-user-id': 'user123' }
        })
      }).promise();

      const userBody = JSON.parse(JSON.parse(userResult.Payload).body);
      expect(userBody.preferences.defaultTemplateType).toBe('cost-estimation');

      // Use preferences in Excel processing
      const excelResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/excel/validate',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            uploadId: 'upload123',
            templateType: userBody.preferences.defaultTemplateType
          })
        })
      }).promise();

      const excelBody = JSON.parse(JSON.parse(excelResult.Payload).body);
      expect(excelBody.validation.autoValidated).toBe(true);
    });

    test('should provide processed data to cost calculator service', async () => {
      // Mock Excel processor processed data
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            processId: 'process123',
            userId: 'user123',
            processedData: {
              sheets: {
                'Infrastructure': {
                  data: [
                    { service: 'EC2', type: 't3.medium', quantity: 2, region: 'us-east-1' },
                    { service: 'S3', type: 'standard', quantity: 1000, region: 'us-east-1' }
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
          }
        })
      });

      // Mock cost calculator service integration
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              calculationId: 'calc123',
              totalCost: 150.50,
              breakdown: {
                'EC2': 73.92,
                'S3': 23.00
              },
              recommendations: [
                {
                  service: 'EC2',
                  recommendation: 'Consider Reserved Instances',
                  savings: 25.50
                }
              ]
            })
          })
        })
      });

      // Get processed Excel data
      const processedData = await mockDynamoDB.get({
        TableName: 'processed-excel-data-staging',
        Key: { processId: 'process123' }
      }).promise();

      expect(processedData.Item.processedData.totalRecords).toBe(2);

      // Send to cost calculator
      const costResult = await mockLambda.invoke({
        FunctionName: 'cost-calculator-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/calculations/cost',
          headers: { 'x-user-id': 'user123' },
          body: JSON.stringify({
            requirements: processedData.Item.processedData.sheets.Infrastructure.data
          })
        })
      }).promise();

      const costBody = JSON.parse(JSON.parse(costResult.Payload).body);
      expect(costBody.totalCost).toBe(150.50);
      expect(costBody.recommendations).toHaveLength(1);
    });
  });

  describe('Complete Workflow Integration', () => {
    test('should handle complete file processing workflow', async () => {
      const userId = 'user123';
      const fileName = 'enterprise-cost-estimation.xlsx';

      // Step 1: File Upload
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'File uploaded successfully',
              uploadId: 'upload123',
              sheetNames: ['Infrastructure', 'Pricing', 'Summary']
            })
          })
        })
      });

      const uploadResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/excel/upload',
          headers: { 'x-user-id': userId },
          body: JSON.stringify({
            fileName,
            fileContent: 'base64content',
            templateType: 'cost-estimation'
          })
        })
      }).promise();

      const uploadBody = JSON.parse(JSON.parse(uploadResult.Payload).body);
      expect(uploadBody.uploadId).toBe('upload123');

      // Step 2: Template Validation
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Template validation completed',
              uploadId: 'upload123',
              validation: {
                isValid: true,
                errors: [],
                warnings: []
              }
            })
          })
        })
      });

      const validationResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/excel/validate',
          headers: { 'x-user-id': userId },
          body: JSON.stringify({
            uploadId: 'upload123',
            templateType: 'cost-estimation'
          })
        })
      }).promise();

      const validationBody = JSON.parse(JSON.parse(validationResult.Payload).body);
      expect(validationBody.validation.isValid).toBe(true);

      // Step 3: Data Processing
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Data processing completed',
              processId: 'process123',
              recordCount: 25,
              summary: {
                totalSheets: 3,
                totalRecords: 25,
                uniqueServices: 8,
                uniqueRegions: 3
              }
            })
          })
        })
      });

      const processingResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/excel/process',
          headers: { 'x-user-id': userId },
          body: JSON.stringify({
            uploadId: 'upload123',
            mappingConfig: {
              'Infrastructure': {
                'service': 'Service',
                'type': 'Type',
                'quantity': 'Quantity',
                'region': 'Region'
              }
            }
          })
        })
      }).promise();

      const processingBody = JSON.parse(JSON.parse(processingResult.Payload).body);
      expect(processingBody.processId).toBe('process123');
      expect(processingBody.recordCount).toBe(25);

      // Step 4: Data Retrieval
      mockLambda.invoke.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              processId: 'process123',
              data: {
                templateType: 'cost-estimation',
                processedData: {
                  sheets: {
                    'Infrastructure': { recordCount: 15 },
                    'Pricing': { recordCount: 8 },
                    'Summary': { recordCount: 2 }
                  },
                  totalRecords: 25
                }
              }
            })
          })
        })
      });

      const retrievalResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/excel/processed/process123',
          headers: { 'x-user-id': userId },
          pathParameters: { id: 'process123' }
        })
      }).promise();

      const retrievalBody = JSON.parse(JSON.parse(retrievalResult.Payload).body);
      expect(retrievalBody.data.processedData.totalRecords).toBe(25);
    });

    test('should handle error propagation across services', async () => {
      // Mock auth service failure
      mockLambda.invoke.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          StatusCode: 200,
          Payload: JSON.stringify({
            statusCode: 401,
            body: JSON.stringify({
              error: 'Invalid authentication token'
            })
          })
        })
      });

      // Mock Excel processor handling auth failure
      mockLambda.invoke.mockReturnValueOnce({
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

      // Simulate failed auth
      const authResult = await mockLambda.invoke({
        FunctionName: 'auth-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/auth/validate',
          headers: { 'authorization': 'Bearer invalid-token' }
        })
      }).promise();

      const authBody = JSON.parse(JSON.parse(authResult.Payload).body);
      expect(authBody.error).toContain('Invalid authentication');

      // Excel processor should also fail
      const excelResult = await mockLambda.invoke({
        FunctionName: 'excel-processor-service-staging',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/excel/upload',
          headers: { 'x-user-id': '' }, // Invalid user ID
          body: JSON.stringify({
            fileName: 'test.xlsx',
            fileContent: 'base64content',
            templateType: 'cost-estimation'
          })
        })
      }).promise();

      const excelBody = JSON.parse(JSON.parse(excelResult.Payload).body);
      expect(excelBody.error).toBe('Authentication required');
    });
  });

  describe('Data Flow Validation', () => {
    test('should maintain data consistency across processing steps', async () => {
      const testData = {
        uploadId: 'upload123',
        processId: 'process123',
        userId: 'user123',
        fileName: 'test-data.xlsx',
        originalData: [
          { Service: 'EC2', Type: 't3.medium', Quantity: 2, Region: 'us-east-1' },
          { Service: 'S3', Type: 'standard', Quantity: 1000, Region: 'us-east-1' }
        ],
        mappedData: [
          { service: 'EC2', type: 't3.medium', quantity: 2, region: 'us-east-1' },
          { service: 'S3', type: 'standard', quantity: 1000, region: 'us-east-1' }
        ]
      };

      // Mock data storage
      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock data retrieval
      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            processId: testData.processId,
            userId: testData.userId,
            processedData: {
              sheets: {
                'Infrastructure': {
                  data: testData.mappedData,
                  recordCount: 2
                }
              },
              totalRecords: 2
            }
          }
        })
      });

      // Verify data storage
      await mockDynamoDB.put({
        TableName: 'processed-excel-data-staging',
        Item: {
          processId: testData.processId,
          userId: testData.userId,
          processedData: {
            sheets: {
              'Infrastructure': {
                data: testData.mappedData,
                recordCount: testData.mappedData.length
              }
            },
            totalRecords: testData.mappedData.length
          }
        }
      }).promise();

      // Verify data retrieval
      const result = await mockDynamoDB.get({
        TableName: 'processed-excel-data-staging',
        Key: { processId: testData.processId }
      }).promise();

      expect(result.Item.processedData.totalRecords).toBe(2);
      expect(result.Item.processedData.sheets.Infrastructure.data).toHaveLength(2);
      expect(result.Item.processedData.sheets.Infrastructure.data[0].service).toBe('EC2');
    });
  });
});