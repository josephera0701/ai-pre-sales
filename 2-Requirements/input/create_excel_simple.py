#!/usr/bin/env python3
import pandas as pd
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows

def create_excel_template():
    # Create a new workbook
    wb = Workbook()
    
    # Remove default sheet
    wb.remove(wb.active)
    
    # Define sheet data
    sheets_data = {
        'Client_Info': [
            ['client_id', 'company_name', 'industry_type', 'company_size', 'primary_contact_name', 'primary_contact_email', 'project_name', 'project_timeline_months', 'budget_range', 'primary_aws_region', 'business_criticality'],
            ['EXAMPLE-UUID-1234', 'Example Corp', 'Technology', 'Enterprise', 'John Smith', 'john.smith@example.com', 'Cloud Migration Project', 12, '$100K-$500K', 'us-east-1', 'High'],
            ['', '', '', '', '', '', '', '', '', '', '']
        ],
        
        'Compute_Requirements': [
            ['compute_id', 'client_id', 'server_name', 'environment_type', 'workload_type', 'cpu_cores', 'ram_gb', 'operating_system', 'business_criticality', 'average_utilization_percent', 'scaling_type', 'min_instances', 'max_instances', 'suggested_instance_type', 'estimated_monthly_cost'],
            ['COMP-UUID-1234', 'EXAMPLE-UUID-1234', 'web-server-01', 'Production', 'Web', 4, 16, 'Amazon Linux', 'High', 70, 'Auto', 2, 10, 'm5.xlarge', '$245.52'],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
        ],
        
        'Storage_Requirements': [
            ['storage_id', 'client_id', 'storage_name', 'storage_purpose', 'current_size_gb', 'projected_growth_rate_percent', 'access_pattern', 'encryption_required', 'backup_required', 'suggested_aws_service', 'estimated_monthly_cost'],
            ['STOR-UUID-1234', 'EXAMPLE-UUID-1234', 'application-data', 'Application_Data', 1000, 20, 'Frequent', 'Yes', 'Yes', 'EBS GP3', '$102.40'],
            ['', '', '', '', '', '', '', '', '', '', '']
        ],
        
        'Network_CDN': [
            ['network_id', 'client_id', 'data_transfer_out_gb_monthly', 'peak_bandwidth_mbps', 'load_balancer_count', 'ssl_certificate_required', 'cdn_required', 'estimated_monthly_cost'],
            ['NET-UUID-1234', 'EXAMPLE-UUID-1234', 500, 1000, 2, 'Yes', 'Yes', '$425.30'],
            ['', '', '', '', '', '', '', '']
        ],
        
        'Database_Requirements': [
            ['database_id', 'client_id', 'database_name', 'database_purpose', 'engine_type', 'database_size_gb', 'instance_class', 'multi_az_required', 'backup_retention_days', 'estimated_monthly_cost'],
            ['DB-UUID-1234', 'EXAMPLE-UUID-1234', 'production-db', 'OLTP', 'MySQL', 100, 'db.r5.large', 'Yes', 7, '$485.60'],
            ['', '', '', '', '', '', '', '', '', '']
        ],
        
        'Security_Compliance': [
            ['security_id', 'client_id', 'compliance_frameworks', 'data_classification', 'aws_config_required', 'cloudtrail_required', 'kms_required', 'estimated_monthly_cost'],
            ['SEC-UUID-1234', 'EXAMPLE-UUID-1234', 'GDPR,SOC2', 'Confidential', 'Yes', 'Yes', 'Yes', '$1250.75'],
            ['', '', '', '', '', '', '', '']
        ]
    }
    
    # Create sheets
    for sheet_name, data in sheets_data.items():
        ws = wb.create_sheet(title=sheet_name)
        for row in data:
            ws.append(row)
    
    # Save the workbook
    wb.save('AWS_Cost_Estimation_Template_Enhanced.xlsx')
    print("Excel file created successfully: AWS_Cost_Estimation_Template_Enhanced.xlsx")

if __name__ == "__main__":
    create_excel_template()
