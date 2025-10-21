const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const createEnhancedTables = async () => {
  const environment = process.env.ENVIRONMENT || 'dev';
  
  // Enhanced main table with 200+ field support
  const enhancedTableParams = {
    TableName: `aws-cost-platform-enhanced-${environment}`,
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
      { AttributeName: 'GSI2PK', AttributeType: 'S' },
      { AttributeName: 'GSI2SK', AttributeType: 'S' },
      { AttributeName: 'GSI3PK', AttributeType: 'S' },
      { AttributeName: 'GSI3SK', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'GSI2',
        KeySchema: [
          { AttributeName: 'GSI2PK', KeyType: 'HASH' },
          { AttributeName: 'GSI2SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'GSI3',
        KeySchema: [
          { AttributeName: 'GSI3PK', KeyType: 'HASH' },
          { AttributeName: 'GSI3SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },

    Tags: [
      { Key: 'Environment', Value: environment },
      { Key: 'Project', Value: 'aws-cost-estimation-platform' },
      { Key: 'Component', Value: 'database' },
      { Key: 'Version', Value: '2.0' }
    ]
  };

  try {
    console.log('Creating enhanced DynamoDB table...');
    const result = await dynamodb.createTable(enhancedTableParams).promise();
    console.log('Enhanced table created successfully:', result.TableDescription.TableName);
    
    // Wait for table to be active
    await dynamodb.waitFor('tableExists', { 
      TableName: enhancedTableParams.TableName 
    }).promise();
    
    console.log('Enhanced table is now active');
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Enhanced table already exists');
      return null;
    }
    throw error;
  }
};

module.exports = { createEnhancedTables };

if (require.main === module) {
  createEnhancedTables()
    .then(() => console.log('Enhanced table creation completed'))
    .catch(console.error);
}