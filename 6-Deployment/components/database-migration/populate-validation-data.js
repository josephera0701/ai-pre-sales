const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const populateValidationData = async () => {
  const environment = process.env.ENVIRONMENT || 'dev';
  const tableName = `aws-cost-platform-enhanced-${environment}`;

  // Validation Rules
  const validationRules = [
    {
      PK: 'VALIDATION_RULES',
      SK: 'FIELD#company_name',
      EntityType: 'ValidationRule',
      FieldName: 'company_name',
      ValidationType: 'text',
      ValidationRule: 'required|min:2|max:100',
      ErrorMessage: 'Company name is required and must be 2-100 characters',
      RequiredField: true
    },
    {
      PK: 'VALIDATION_RULES',
      SK: 'FIELD#primary_contact_email',
      EntityType: 'ValidationRule',
      FieldName: 'primary_contact_email',
      ValidationType: 'email',
      ValidationRule: 'required|email',
      ErrorMessage: 'Valid email address is required',
      RequiredField: true
    },
    {
      PK: 'VALIDATION_RULES',
      SK: 'FIELD#cpu_cores',
      EntityType: 'ValidationRule',
      FieldName: 'cpu_cores',
      ValidationType: 'number',
      ValidationRule: 'required|min:1|max:128',
      ErrorMessage: 'CPU cores must be between 1 and 128',
      RequiredField: true
    }
  ];

  // Dropdown Lists
  const dropdownLists = [
    {
      PK: 'DROPDOWN_LISTS',
      SK: 'LIST#industry_types',
      EntityType: 'DropdownList',
      ListName: 'industry_types',
      ListValues: ['E-commerce', 'Healthcare', 'Financial Services', 'Manufacturing', 'Technology', 'Education', 'Government', 'Media'],
      DefaultValue: 'Technology',
      Description: 'Available industry types for client classification'
    },
    {
      PK: 'DROPDOWN_LISTS',
      SK: 'LIST#company_sizes',
      EntityType: 'DropdownList',
      ListName: 'company_sizes',
      ListValues: ['Startup', 'SME', 'Enterprise'],
      DefaultValue: 'SME',
      Description: 'Company size categories'
    },
    {
      PK: 'DROPDOWN_LISTS',
      SK: 'LIST#aws_regions',
      EntityType: 'DropdownList',
      ListName: 'aws_regions',
      ListValues: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      DefaultValue: 'us-east-1',
      Description: 'Available AWS regions'
    }
  ];

  // Service Mapping
  const serviceMappings = [
    {
      PK: 'SERVICE_MAPPING',
      SK: 'COMPUTE#4_cores_16_gb',
      EntityType: 'ServiceMapping',
      RequirementType: 'compute',
      RequirementValue: '4_cores_16_gb',
      SuggestedAWSService: 'EC2',
      SuggestedInstanceType: 't3.xlarge',
      AlternativeServices: ['t3.large', 'm5.xlarge', 'c5.xlarge'],
      CostFactor: 0.1664,
      OptimizationNotes: 'Consider Reserved Instances for 40% savings'
    }
  ];

  // Optimization Tips
  const optimizationTips = [
    {
      PK: 'OPTIMIZATION_TIPS',
      SK: 'TIP#reserved_instances',
      EntityType: 'OptimizationTip',
      TipId: 'reserved_instances',
      Category: 'compute',
      Title: 'Reserved Instances Savings',
      Description: 'Save up to 72% with Reserved Instances for predictable workloads',
      ApplicableServices: ['EC2', 'RDS', 'ElastiCache'],
      PotentialSavingsPercent: 40,
      ImplementationComplexity: 'Low',
      RecommendationPriority: 'High'
    }
  ];

  const allItems = [...validationRules, ...dropdownLists, ...serviceMappings, ...optimizationTips];

  try {
    console.log('Populating validation data...');
    
    for (const item of allItems) {
      await dynamodb.put({
        TableName: tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)'
      }).promise();
      console.log(`Inserted: ${item.PK}#${item.SK}`);
    }
    
    console.log('Validation data populated successfully');
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      console.log('Some validation data already exists, skipping...');
    } else {
      throw error;
    }
  }
};

module.exports = { populateValidationData };

if (require.main === module) {
  populateValidationData()
    .then(() => console.log('Validation data population completed'))
    .catch(console.error);
}