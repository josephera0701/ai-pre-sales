const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const migrateExistingData = async () => {
  const environment = process.env.ENVIRONMENT || 'dev';
  const oldTableName = `aws-cost-platform-${environment}`;
  const newTableName = `aws-cost-platform-enhanced-${environment}`;

  try {
    console.log('Starting data migration from old to enhanced table...');
    
    // Scan old table
    const scanParams = {
      TableName: oldTableName
    };
    
    let items = [];
    let lastEvaluatedKey = null;
    
    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }
      
      const result = await dynamodb.scan(scanParams).promise();
      items = items.concat(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
      
      console.log(`Scanned ${items.length} items so far...`);
    } while (lastEvaluatedKey);
    
    console.log(`Total items to migrate: ${items.length}`);
    
    // Transform and migrate data
    for (const item of items) {
      const enhancedItem = transformToEnhancedSchema(item);
      
      await dynamodb.put({
        TableName: newTableName,
        Item: enhancedItem
      }).promise();
      
      console.log(`Migrated item: ${enhancedItem.PK}#${enhancedItem.SK}`);
    }
    
    console.log('Data migration completed successfully');
    
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log('Old table not found, skipping migration');
      return;
    }
    throw error;
  }
};

const transformToEnhancedSchema = (oldItem) => {
  // Transform old schema to enhanced schema
  const enhancedItem = {
    ...oldItem,
    // Add new required fields for enhanced schema
    EntityType: oldItem.EntityType || 'Unknown',
    CreatedAt: oldItem.CreatedAt || new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };

  // Handle estimation entities
  if (oldItem.estimationId) {
    enhancedItem.PK = `ESTIMATION#${oldItem.estimationId}`;
    enhancedItem.SK = 'METADATA';
    enhancedItem.GSI1PK = `USER#${oldItem.userId}`;
    enhancedItem.GSI1SK = `ESTIMATION#${oldItem.createdAt}`;
    enhancedItem.GSI2PK = `STATUS#${oldItem.status || 'ACTIVE'}`;
    enhancedItem.GSI2SK = `ESTIMATION#${oldItem.estimationId}`;
    
    // Transform client info to enhanced format
    if (oldItem.clientInfo) {
      enhancedItem.EnhancedClientInfo = {
        ...oldItem.clientInfo,
        ClientId: oldItem.clientInfo.clientId || `client_${Date.now()}`,
        IndustryType: oldItem.clientInfo.industry || 'Technology',
        CompanySize: oldItem.clientInfo.companySize || 'SME',
        BusinessCriticality: oldItem.clientInfo.businessCriticality || 'Medium',
        DisasterRecoveryRequired: oldItem.clientInfo.disasterRecoveryRequired || false,
        MultiRegionRequired: oldItem.clientInfo.multiRegionRequired || false
      };
    }
  }

  // Handle user entities
  if (oldItem.userId && !oldItem.estimationId) {
    enhancedItem.PK = `USER#${oldItem.userId}`;
    enhancedItem.SK = 'PROFILE';
    enhancedItem.GSI1PK = `USER#${oldItem.email}`;
    enhancedItem.GSI1SK = 'PROFILE';
  }

  return enhancedItem;
};

module.exports = { migrateExistingData };

if (require.main === module) {
  migrateExistingData()
    .then(() => console.log('Data migration completed'))
    .catch(console.error);
}