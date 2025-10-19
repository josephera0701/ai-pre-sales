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
    getSignedUrl: jest.fn()
  })),
  Lambda: jest.fn(() => ({}))
}));

// Mock document libraries
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      }
    }),
    end: jest.fn()
  }));
});

jest.mock('docx', () => ({
  Document: jest.fn(),
  Packer: {
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-docx-content'))
  },
  Paragraph: jest.fn(),
  TextRun: jest.fn()
}));

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  write: jest.fn(() => Buffer.from('mock-excel-content'))
}));

const AWS = require('aws-sdk');

describe('Document Generator Service', () => {
  let mockDynamoDB, mockS3;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    mockS3 = new AWS.S3();
  });

  describe('Document Generation', () => {
    test('should generate PDF document successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'pdf',
          templateType: 'standard',
          estimationData: {
            totalMonthlyCost: 150.50,
            costBreakdown: {
              'EC2': 73.92,
              'S3': 23.00,
              'RDS': 53.58
            },
            recommendations: [
              {
                title: 'Consider Reserved Instances',
                savings: 25.50,
                priority: 'High'
              }
            ]
          },
          clientInfo: {
            companyName: 'Test Company',
            contactName: 'John Doe',
            email: 'john@test.com'
          }
        })
      };

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockS3.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Document generated successfully');
      expect(body.documentId).toBeDefined();
      expect(body.documentType).toBe('pdf');
      expect(body.downloadUrl).toContain('/documents/');
    });

    test('should generate Word document successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'word',
          estimationData: {
            totalMonthlyCost: 200.75
          },
          clientInfo: {
            companyName: 'Test Corp'
          }
        })
      };

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockS3.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documentType).toBe('word');
      expect(body.fileSize).toBeGreaterThan(0);
    });

    test('should generate Excel document successfully', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'excel',
          estimationData: {
            totalMonthlyCost: 300.25,
            costBreakdown: {
              'EC2': 150.00,
              'S3': 50.25,
              'Lambda': 100.00
            }
          }
        })
      };

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockS3.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      mockDynamoDB.update.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documentType).toBe('excel');
    });

    test('should reject generation without required fields', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'pdf'
          // Missing estimationData
        })
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required fields');
    });

    test('should reject unsupported document type', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'unsupported',
          estimationData: { totalMonthlyCost: 100 }
        })
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Unsupported document type');
    });

    test('should reject generation without authentication', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: {},
        body: JSON.stringify({
          documentType: 'pdf',
          estimationData: { totalMonthlyCost: 100 }
        })
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Authentication required');
    });
  });

  describe('Document Status', () => {
    test('should return document status', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/doc123/status',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'doc123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            documentId: 'doc123',
            userId: 'user123',
            status: 'completed',
            documentType: 'pdf',
            createdAt: '2023-01-01T00:00:00Z',
            completedAt: '2023-01-01T00:01:00Z',
            fileSize: 12345
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documentId).toBe('doc123');
      expect(body.status).toBe('completed');
      expect(body.downloadUrl).toContain('/documents/doc123/download');
    });

    test('should reject status request for non-existent document', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/nonexistent/status',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'nonexistent' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Document not found');
    });

    test('should reject status request for other user document', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/doc123/status',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'doc123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            documentId: 'doc123',
            userId: 'otheruser', // Different user
            status: 'completed'
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Document not found');
    });
  });

  describe('Document Download', () => {
    test('should generate download URL for completed document', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/doc123/download',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'doc123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            documentId: 'doc123',
            userId: 'user123',
            status: 'completed',
            s3Key: 'documents/user123/doc123.pdf',
            contentType: 'application/pdf',
            fileSize: 12345
          }
        })
      });

      mockS3.getSignedUrl.mockReturnValue('https://s3.amazonaws.com/signed-url');

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.downloadUrl).toBe('https://s3.amazonaws.com/signed-url');
      expect(body.expiresIn).toBe(3600);
      expect(body.fileSize).toBe(12345);
    });

    test('should reject download for incomplete document', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/doc123/download',
        headers: { 'x-user-id': 'user123' },
        pathParameters: { id: 'doc123' }
      };

      mockDynamoDB.get.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            documentId: 'doc123',
            userId: 'user123',
            status: 'generating' // Not completed
          }
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Document not ready for download');
      expect(body.status).toBe('generating');
    });
  });

  describe('Get Documents', () => {
    test('should return user documents list', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents',
        headers: { 'x-user-id': 'user123' }
      };

      mockDynamoDB.query.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              documentId: 'doc1',
              documentType: 'pdf',
              templateType: 'standard',
              status: 'completed',
              createdAt: '2023-01-01T00:00:00Z',
              fileSize: 12345,
              clientInfo: { companyName: 'Test Co' }
            },
            {
              documentId: 'doc2',
              documentType: 'word',
              templateType: 'executive',
              status: 'generating',
              createdAt: '2023-01-02T00:00:00Z'
            }
          ],
          Count: 2
        })
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toHaveLength(2);
      expect(body.totalCount).toBe(2);
      expect(body.documents[0].documentId).toBe('doc1');
    });
  });

  describe('Get Templates', () => {
    test('should return available templates', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/templates',
        headers: { 'x-user-id': 'user123' }
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.templates).toBeDefined();
      expect(body.templates.length).toBeGreaterThan(0);
      expect(body.templates[0].templateType).toBe('standard');
      expect(body.templates[0].supportedFormats).toContain('pdf');
    });
  });

  describe('Error Handling', () => {
    test('should handle DynamoDB errors', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/documents/generate',
        headers: { 'x-user-id': 'user123' },
        body: JSON.stringify({
          documentType: 'pdf',
          estimationData: { totalMonthlyCost: 100 }
        })
      };

      mockDynamoDB.put.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
      });

      const result = await handler(event);
      
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Failed to generate document');
    });

    test('should handle unknown endpoints', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/documents/unknown',
        headers: { 'x-user-id': 'user123' }
      };

      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Endpoint not found');
    });
  });
});