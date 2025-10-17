# Excel Template Mapping Specification

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 2 - Requirements Analysis
- **Date:** 2024-01-15
- **Version:** 1.0

## Excel Template Structure Analysis

### Template Overview
The AWS_Cost_Estimation_Template.xlsx contains 8 sheets with structured data for comprehensive AWS cost estimation:

1. **Client_Info** - Basic client and project information
2. **Compute_Requirements** - Server specifications and scaling needs
3. **Storage_Requirements** - Data storage and backup requirements
4. **Network_CDN** - Network, CDN, and load balancing needs
5. **Database_Requirements** - Database engine and configuration specs
6. **Security_Compliance** - Security services and compliance requirements
7. **Cost_Summary** - Cost breakdown and totals
8. **AWS_Service_Mapping** - Service recommendations and alternatives

## Sheet-by-Sheet Mapping to UI Components

### 1. Client_Info Sheet → Client Information Form

| Excel Field | UI Component | Validation | Required |
|-------------|--------------|------------|----------|
| Company Name | Text Input | 2-100 characters | Yes |
| Industry | Dropdown | Predefined list | Yes |
| Primary Contact | Text Input | Name format | Yes |
| Email | Email Input | Valid email format | Yes |
| Phone | Phone Input | International format | No |
| Project Name | Text Input | 3-100 characters | Yes |
| Project Description | Textarea | Max 500 characters | No |
| Timeline | Date Picker | Future date | Yes |
| Budget Range | Dropdown | Predefined ranges | No |
| Region Preference | Multi-select | AWS regions | Yes |
| Compliance Requirements | Checkbox Group | GDPR, HIPAA, SOC2, etc. | No |
| Technical Contact | Text Input | Name format | No |

### 2. Compute_Requirements Sheet → Server Configuration Form

| Excel Field | UI Component | Validation | AWS Mapping |
|-------------|--------------|------------|-------------|
| Server_Name | Text Input | Unique names | Resource tagging |
| Environment | Dropdown | Production/Staging/Dev | Instance tagging |
| CPU_Cores | Number Input | 1-128 cores | Instance type selection |
| RAM_GB | Number Input | 1-3904 GB | Instance type selection |
| OS | Dropdown | Linux/Windows | AMI selection |
| Criticality | Dropdown | Low/Medium/High/Critical | Availability zone strategy |
| Utilization_% | Slider | 10-100% | Cost calculation factor |
| Peak_Utilization_% | Slider | Utilization% to 100% | Auto-scaling trigger |
| Scaling_Type | Radio | Manual/Auto/Scheduled | Auto Scaling Group config |
| Min_Instances | Number Input | 1-100 | ASG minimum |
| Max_Instances | Number Input | Min to 1000 | ASG maximum |
| Monthly_Hours | Number Input | 1-744 hours | Cost calculation |
| Suggested_Instance_Type | Auto-calculated | Based on CPU/RAM | EC2 instance recommendation |

### 3. Storage_Requirements Sheet → Storage Configuration Form

| Excel Field | UI Component | Validation | AWS Mapping |
|-------------|--------------|------------|-------------|
| Storage_Type | Dropdown | Application/Database/Media/Backup | Service type selection |
| Current_GB | Number Input | 1-unlimited | Storage size |
| Growth_Rate_% | Number Input | 0-1000% | Capacity planning |
| IOPS_Required | Number Input | 100-64000 | EBS volume type |
| Throughput_MBps | Number Input | 125-4000 | EBS throughput |
| Backup_Required | Toggle | Yes/No | Backup strategy |
| Retention_Days | Number Input | 1-2555 days | Backup retention |
| Access_Pattern | Dropdown | Frequent/Infrequent/Archive | S3 storage class |
| Suggested_AWS_Service | Auto-calculated | Based on requirements | EBS/S3 recommendation |

### 4. Network_CDN Sheet → Network Configuration Form

| Excel Field | UI Component | Validation | AWS Mapping |
|-------------|--------------|------------|-------------|
| Data Transfer Out (GB/month) | Number Input | 0-unlimited | CloudFront/Data Transfer costs |
| Peak Bandwidth (Mbps) | Number Input | 1-100000 | Network capacity planning |
| Load Balancer | Number Input | 0-100 | ALB/NLB count |
| SSL Certificate | Toggle | Yes/No | ACM certificate |
| WAF Required | Toggle | Yes/No | AWS WAF |
| DDoS Protection | Toggle | Yes/No | AWS Shield |
| Global Distribution | Toggle | Yes/No | CloudFront edge locations |

### 5. Database_Requirements Sheet → Database Configuration Form

| Excel Field | UI Component | Validation | AWS Mapping |
|-------------|--------------|------------|-------------|
| Database_Name | Text Input | Unique names | RDS identifier |
| Engine | Dropdown | MySQL/PostgreSQL/Oracle/SQL Server | RDS engine |
| Version | Dropdown | Engine-specific versions | Engine version |
| Size_GB | Number Input | 20-65536 GB | Storage allocation |
| Instance_Class | Dropdown | db.t3.micro to db.r5.24xlarge | RDS instance type |
| Multi_AZ | Toggle | Yes/No | High availability |
| Read_Replicas | Number Input | 0-15 | Read replica count |
| Backup_Retention | Number Input | 0-35 days | Backup retention |
| Encryption | Toggle | Yes/No | Encryption at rest |

### 6. Security_Compliance Sheet → Security Services Form

| Excel Field | UI Component | Validation | AWS Mapping |
|-------------|--------------|------------|-------------|
| AWS Config | Toggle | Yes/No | Compliance monitoring |
| CloudTrail | Toggle | Yes/No | Audit logging |
| GuardDuty | Toggle | Yes/No | Threat detection |
| Security Hub | Toggle | Yes/No | Security posture |
| Inspector | Toggle | Yes/No | Vulnerability assessment |
| Macie | Toggle | Yes/No | Data discovery |
| KMS | Toggle | Yes/No | Key management |
| Secrets Manager | Toggle | Yes/No | Secret management |

## UI Form Structure Based on Excel Template

### Form Sections and Navigation

```
1. Getting Started
   ├── Choose Input Method (Excel Upload / Manual Entry)
   └── Project Overview

2. Client Information (from Client_Info sheet)
   ├── Company Details
   ├── Contact Information
   └── Project Requirements

3. Infrastructure Requirements
   ├── Compute Resources (from Compute_Requirements sheet)
   ├── Storage Needs (from Storage_Requirements sheet)
   ├── Network & CDN (from Network_CDN sheet)
   └── Database Requirements (from Database_Requirements sheet)

4. Security & Compliance (from Security_Compliance sheet)
   ├── Security Services
   └── Compliance Requirements

5. Review & Calculate
   ├── Configuration Summary
   ├── Cost Breakdown (populates Cost_Summary sheet)
   └── AWS Service Mapping (references AWS_Service_Mapping sheet)

6. Generate Proposal
   ├── Document Options
   └── Export Formats
```

## Excel Upload Processing Logic

### 1. File Validation
```
- Check file extension (.xlsx, .xls)
- Validate file size (max 10MB)
- Verify all required sheets exist
- Check sheet structure and column headers
```

### 2. Data Extraction and Validation
```
For each sheet:
  - Extract data from required columns
  - Validate data types and formats
  - Check required field completeness
  - Cross-reference dependencies
  - Generate validation report
```

### 3. UI Population
```
- Map Excel data to corresponding UI form fields
- Set dropdown selections based on Excel values
- Populate calculated fields
- Enable real-time cost calculation
- Highlight any unmapped or invalid data
```

### 4. Error Handling
```
- Sheet missing: Provide template download
- Invalid data: Highlight specific cells with corrections
- Partial data: Allow proceeding with warnings
- Format errors: Suggest proper formats with examples
```

## Cost Calculation Integration

### Excel Data to AWS Pricing
- **Compute:** Map CPU/RAM/OS to EC2 instance types and pricing
- **Storage:** Calculate EBS/S3 costs based on size, IOPS, throughput
- **Network:** Estimate data transfer and CloudFront costs
- **Database:** Calculate RDS costs including Multi-AZ and replicas
- **Security:** Add security service costs based on selections

### Real-time Updates
- Recalculate costs when any field changes
- Update suggestions when requirements change
- Validate configurations against AWS limits
- Show cost impact of different options

## Validation Rules

### Cross-Field Dependencies
- Instance type must support selected IOPS
- Database engine version compatibility
- Region availability for selected services
- Scaling configuration logical consistency

### Business Rules
- Minimum viable configurations
- Cost optimization suggestions
- Security best practices
- Compliance requirement mapping

## Export Functionality

### Excel Export Structure
- Maintain original template format
- Include calculated costs and recommendations
- Add validation status and notes
- Preserve user modifications and comments

### Document Generation
- Use Excel data for proposal generation
- Include all configuration details
- Add cost breakdown by category
- Include AWS service mapping and alternatives

## Implementation Priority

### Phase 1 (MVP)
- Basic Excel upload and validation
- Core sheet processing (Client_Info, Compute, Storage)
- Simple UI form population
- Basic cost calculation

### Phase 2 (Enhanced)
- Advanced validation and error handling
- Complete sheet integration
- Real-time cost updates
- Export functionality

### Phase 3 (Full Feature)
- Advanced AWS service mapping
- Optimization suggestions
- Template versioning
- Bulk processing capabilities