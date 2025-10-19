# AWS Pre-Sales Resources Cleanup Instructions

## Overview
This cleanup process will safely remove only AWS Cost Estimation Platform related resources, leaving other AWS resources untouched.

## Safety Features
✅ **Selective Targeting:** Only removes resources matching pre-sales patterns  
✅ **Confirmation Required:** Prompts before deleting each resource type  
✅ **Non-Destructive:** Won't affect unrelated AWS resources  
✅ **Detailed Logging:** Shows exactly what will be deleted  

## Resources Targeted for Cleanup

### CloudFormation Stacks
- `aws-cost-platform-*`
- `aws-cost-estimation-*`

### S3 Buckets
- `aws-cost-platform-*`
- `aws-cost-estimation-*`
- `*-presales-*`

### DynamoDB Tables
- Tables containing: `cost`, `estimation`, `presales`

### Cognito User Pools
- Pools containing: `cost-estimation`, `presales`

### Lambda Functions
- Functions containing: `cost`, `estimation`, `presales`

### API Gateways
- APIs containing: `cost`, `estimation`, `presales`

### Secrets Manager
- Secrets containing: `cost`, `estimation`, `presales`

## How to Run Cleanup

### Prerequisites
1. AWS CLI installed and configured
2. Appropriate AWS permissions for resource deletion
3. Confirm you want to delete pre-sales resources

### Execute Cleanup
```bash
# Make script executable (if not already)
chmod +x cleanup-aws-resources.sh

# Run the cleanup script
./cleanup-aws-resources.sh
```

### Interactive Process
The script will:
1. ✅ Check AWS CLI configuration
2. 🔍 Scan for pre-sales related resources
3. 📋 Show you exactly what will be deleted
4. ❓ Ask for confirmation before each resource type
5. 🗑️ Delete confirmed resources
6. ✅ Provide completion summary

## Example Output
```
🧹 AWS Cost Estimation Platform Resource Cleanup
================================================
✅ AWS CLI configured

🔍 Checking CloudFormation stacks...
🔍 Found CloudFormation stacks:
aws-cost-platform-staging
aws-cost-platform-dev

❓ Delete these CloudFormation stacks? (y/N): y
🗑️ Deleting stack: aws-cost-platform-staging
🗑️ Deleting stack: aws-cost-platform-dev
⏳ Waiting for stack deletions to complete...
```

## What Gets Preserved
- ✅ Other AWS resources not matching pre-sales patterns
- ✅ Personal AWS resources
- ✅ Production resources from other projects
- ✅ AWS account settings and configurations

## Manual Verification
After cleanup, verify in AWS Console:
1. **CloudFormation:** No pre-sales stacks remaining
2. **S3:** No pre-sales buckets remaining
3. **DynamoDB:** No pre-sales tables remaining
4. **Lambda:** No pre-sales functions remaining
5. **API Gateway:** No pre-sales APIs remaining

## Troubleshooting

### Permission Errors
If you get permission errors:
```bash
# Check your AWS permissions
aws sts get-caller-identity
aws iam get-user
```

### Resources Not Found
If script says "No resources found":
- ✅ Good! No pre-sales resources to clean up
- 🔍 Resources may have been deleted already

### Partial Cleanup
If some resources fail to delete:
- ⏳ Wait a few minutes and run script again
- 🔗 Some resources have dependencies that need time
- 🖥️ Check AWS Console for any remaining resources

## Safety Notes
- 🛡️ Script only targets pre-sales related resources
- 🔍 Always review what will be deleted before confirming
- 💾 No backup is created - ensure you don't need these resources
- ⏰ Some resources may take time to fully delete

## Support
If you encounter issues:
1. Check AWS Console for resource status
2. Verify AWS CLI permissions
3. Run script again after waiting 5-10 minutes
4. Contact AWS support for persistent issues