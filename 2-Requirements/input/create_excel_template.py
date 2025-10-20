#!/usr/bin/env python3
import pandas as pd
import os

def create_excel_from_csvs():
    # Define the CSV files and their corresponding sheet names
    csv_files = {
        'Client_Info': 'Client_Info_Enhanced.csv',
        'Compute_Requirements': 'Compute_Requirements_Enhanced.csv', 
        'Storage_Requirements': 'Storage_Requirements_Enhanced.csv',
        'Network_CDN': 'Network_CDN_Enhanced.csv',
        'Database_Requirements': 'Database_Requirements_Enhanced.csv',
        'Security_Compliance': 'Security_Compliance_Enhanced.csv',
        'Validation_Rules': 'Validation_Rules.csv',
        'Dropdown_Lists': 'Dropdown_Lists.csv',
        'Service_Mapping': 'Service_Mapping.csv'
    }
    
    # Create Excel writer object
    output_file = 'AWS_Cost_Estimation_Template_Enhanced.xlsx'
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        for sheet_name, csv_file in csv_files.items():
            if os.path.exists(csv_file):
                # Read CSV and write to Excel sheet
                df = pd.read_csv(csv_file)
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"Added sheet: {sheet_name}")
            else:
                print(f"Warning: {csv_file} not found")
    
    print(f"Excel file created: {output_file}")

if __name__ == "__main__":
    create_excel_from_csvs()
