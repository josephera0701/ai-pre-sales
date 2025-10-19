const { handler } = require('../src/index');

// Mock AWS services
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnValue({ promise: jest.fn() }),
      get: jest.fn().mockReturnValue({ promise: jest.fn() }),
      query: jest.fn().mockReturnValue({ promise: jest.fn() }),
      update: jest.fn().mockReturnValue({ promise: jest.fn() })
    }))
  },
  S3: jest.fn(() => ({
    putObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    getObject: jest.fn().mockReturnValue({ promise: jest.fn() })
  })),
  Lambda: jest.fn(() => ({}))
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

const AWS = require('aws-sdk');
const XLSX = require('xlsx');

describe('Excel Processor Service', () => {
  let mockDynamoDB, mockS3;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    mockS3 = new AWS.S3();
  });

  describe('File Upload', () => {
    test('should upload Excel file successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          fileName: 'test.xlsx',
          fileContent: 'base64content',
          templateType: 'cost-estimation'
        })
      };

      XLSX.read.mockReturnValue({
        SheetNames: ['Infrastructure', 'Pricing', 'Summary']
      });

      mockS3.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('File uploaded successfully');
      expect(body.uploadId).toBeDefined();
      expect(body.sheetNames).toEqual(['Infrastructure', 'Pricing', 'Summary']);
    });

    test('should reject upload without required fields', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          fileName: 'test.xlsx'
          // Missing fileContent and templateType
        })
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required fields');
    });

    test('should reject upload without authentication', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: {},
        body: JSON.stringify({
          fileName: 'test.xlsx',
          fileContent: 'base64content',
          templateType: 'cost-estimation'
        })
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Authentication required');
    });

    test('should handle invalid Excel file', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          fileName: 'test.xlsx',
          fileContent: 'base64content',
          templateType: 'cost-estimation'
        })
      };

      XLSX.read.mockReturnValue({
        SheetNames: []
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Invalid Excel file');
    });
  });

  describe('Template Validation', () => {
    test('should validate template successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/validate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          uploadId: 'upload123',
          templateType: 'cost-estimation'
        })
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            uploadId: 'upload123',
            userId: 'user123',
            s3Key: 'uploads/user123/test.xlsx'
          }
        })
      });

      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: Buffer.from('excel-content')
        })
      });

      XLSX.read.mockReturnValue({
        SheetNames: ['Infrastructure', 'Pricing', 'Summary'],
        Sheets: {
          'Infrastructure': {},
          'Pricing': {},
          'Summary': {}
        }
      });

      XLSX.utils.sheet_to_json.mockReturnValue([
        ['Service', 'Type', 'Quantity', 'Region'],
        ['EC2', 't3.medium', 2, 'us-east-1']
      ]);

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Template validation completed');
      expect(body.validation.isValid).toBe(true);
    });

    test('should detect missing required sheets', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/validate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          uploadId: 'upload123',
          templateType: 'cost-estimation'
        })
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            uploadId: 'upload123',
            userId: 'user123',
            s3Key: 'uploads/user123/test.xlsx'
          }
        })
      });

      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: Buffer.from('excel-content')
        })
      });

      XLSX.read.mockReturnValue({
        SheetNames: ['Infrastructure'], // Missing Pricing and Summary
        Sheets: {
          'Infrastructure': {}
        }
      });

      XLSX.utils.sheet_to_json.mockReturnValue([
        ['Service', 'Type', 'Quantity', 'Region']
      ]);

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.validation.isValid).toBe(false);
      expect(body.validation.errors).toContain('Missing required sheet: Pricing');
      expect(body.validation.errors).toContain('Missing required sheet: Summary');
    });

    test('should reject validation for non-existent upload', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/validate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          uploadId: 'nonexistent',
          templateType: 'cost-estimation'
        })
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Upload not found');
    });
  });

  describe('Data Processing', () => {
    test('should process Excel data successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/process',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          uploadId: 'upload123',
          mappingConfig: {
            'Infrastructure': {
              'service': 'Service',
              'type': 'Type',
              'quantity': 'Quantity'
            }
          }
        })
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            uploadId: 'upload123',
            userId: 'user123',
            status: 'validated',
            s3Key: 'uploads/user123/test.xlsx',
            templateType: 'cost-estimation'
          }
        })
      });

      mockS3.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: Buffer.from('excel-content')
        })
      });

      XLSX.read.mockReturnValue({
        SheetNames: ['Infrastructure', 'Pricing'],
        Sheets: {
          'Infrastructure': {},
          'Pricing': {}
        }
      });

      XLSX.utils.sheet_to_json.mockReturnValue([
        { Service: 'EC2', Type: 't3.medium', Quantity: 2, Region: 'us-east-1' },
        { Service: 'S3', Type: 'standard', Quantity: 1000, Region: 'us-east-1' }
      ]);

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Data processing completed');
      expect(body.processId).toBeDefined();
      expect(body.recordCount).toBe(4); // 2 sheets × 2 records each
    });

    test('should reject processing unvalidated file', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/process',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          uploadId: 'upload123'
        })
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            uploadId: 'upload123',
            userId: 'user123',
            status: 'uploaded' // Not validated
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('File must be validated before processing');
    });
  });

  describe('Get Templates', () => {
    test('should return available templates', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/excel/templates',
        headers: { 'x-user-id': 'user123' }
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.templates).toBeDefined();
      expect(body.templates.length).toBeGreaterThan(0);
      expect(body.templates[0].templateType).toBe('cost-estimation');
    });
  });

  describe('Get Processed Data', () => {
    test('should return processed data', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/excel/processed/process123',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'process123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            processId: 'process123',
            userId: 'user123',
            processedData: { sheets: {}, totalRecords: 10 }
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.processId).toBe('process123');
      expect(body.data).toBeDefined();
    });

    test('should reject access to other user data', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/excel/processed/process123',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'process123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            processId: 'process123',
            userId: 'otheruser', // Different user
            processedData: { sheets: {}, totalRecords: 10 }
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Processed data not found');
    });
  });

  describe('Get Processing History', () => {
    test('should return user processing history', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/excel/history',
        headers: { 'x-user-id': 'user123' }
      };

      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              uploadId: 'upload1',
              processId: 'process1',
              fileName: 'file1.xlsx',
              templateType: 'cost-estimation',
              status: 'processed',
              uploadedAt: '2023-01-01T00:00:00Z',
              processedAt: '2023-01-01T00:05:00Z'
            }
          ],
          Count: 1
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.history).toBeDefined();
      expect(body.history.length).toBe(1);
      expect(body.totalCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle DynamoDB errors', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/excel/upload',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          fileName: 'test.xlsx',
          fileContent: 'base64content',
          templateType: 'cost-estimation'
        })
      };

      XLSX.read.mockReturnValue({
        SheetNames: ['Infrastructure']
      });

      mockS3.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Failed to upload file');
    });

    test('should handle unknown endpoints', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/excel/unknown',
        headers: { 'x-user-id': 'user123' }
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Endpoint not found');
    });
  });
});