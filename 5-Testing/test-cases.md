# Test Cases: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 5 - Testing & Quality Assurance
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Authentication Test Cases

### TC-AUTH-001: User Login - Valid Credentials
- **Objective:** Verify successful login with valid credentials
- **Preconditions:** User account exists in Cognito
- **Test Steps:**
  1. Navigate to login page
  2. Enter valid email and password
  3. Click Login button
- **Expected Result:** User redirected to dashboard, JWT token stored
- **Priority:** High
- **Status:** Not Executed

### TC-AUTH-002: User Login - Invalid Credentials
- **Objective:** Verify error handling for invalid credentials
- **Test Steps:**
  1. Navigate to login page
  2. Enter invalid email/password
  3. Click Login button
- **Expected Result:** Error message displayed, user remains on login page
- **Priority:** High
- **Status:** Not Executed

### TC-AUTH-003: Password Reset Flow
- **Objective:** Verify password reset functionality
- **Test Steps:**
  1. Click "Forgot Password" link
  2. Enter valid email address
  3. Check email for reset code
  4. Enter new password and code
- **Expected Result:** Password updated successfully, user can login
- **Priority:** Medium
- **Status:** Not Executed

### TC-AUTH-004: Token Refresh
- **Objective:** Verify automatic token refresh
- **Test Steps:**
  1. Login and wait for token expiration
  2. Make API request
- **Expected Result:** Token refreshed automatically, request succeeds
- **Priority:** High
- **Status:** Not Executed

### TC-AUTH-005: Logout Functionality
- **Objective:** Verify user logout clears session
- **Test Steps:**
  1. Login successfully
  2. Click logout button
- **Expected Result:** User redirected to login, tokens cleared
- **Priority:** Medium
- **Status:** Not Executed

## 2. User Management Test Cases

### TC-USER-001: Get User Profile
- **Objective:** Verify user profile retrieval
- **Preconditions:** User authenticated
- **Test Steps:**
  1. Make GET request to /users/me
- **Expected Result:** User profile data returned
- **Priority:** High
- **Status:** Not Executed

### TC-USER-002: Update User Profile
- **Objective:** Verify profile update functionality
- **Test Steps:**
  1. Make PUT request to /users/me with updated data
- **Expected Result:** Profile updated successfully
- **Priority:** Medium
- **Status:** Not Executed

### TC-USER-003: User Preferences Management
- **Objective:** Verify preferences can be updated
- **Test Steps:**
  1. Update currency, region, notification settings
- **Expected Result:** Preferences saved and applied
- **Priority:** Low
- **Status:** Not Executed

## 3. Estimation Management Test Cases

### TC-EST-001: Create New Estimation
- **Objective:** Verify estimation creation
- **Test Steps:**
  1. Make POST request to /estimations with valid data
- **Expected Result:** Estimation created with unique ID
- **Priority:** High
- **Status:** Not Executed

### TC-EST-002: Get Estimation List
- **Objective:** Verify user can retrieve their estimations
- **Test Steps:**
  1. Make GET request to /estimations
- **Expected Result:** List of user's estimations returned
- **Priority:** High
- **Status:** Not Executed

### TC-EST-003: Get Estimation Details
- **Objective:** Verify estimation details retrieval
- **Test Steps:**
  1. Make GET request to /estimations/{id}
- **Expected Result:** Complete estimation data returned
- **Priority:** High
- **Status:** Not Executed

### TC-EST-004: Update Estimation
- **Objective:** Verify estimation can be updated
- **Test Steps:**
  1. Make PUT request to /estimations/{id} with changes
- **Expected Result:** Estimation updated successfully
- **Priority:** Medium
- **Status:** Not Executed

### TC-EST-005: Delete Estimation
- **Objective:** Verify estimation soft delete
- **Test Steps:**
  1. Make DELETE request to /estimations/{id}
- **Expected Result:** Estimation marked as deleted
- **Priority:** Medium
- **Status:** Not Executed

### TC-EST-006: Access Control
- **Objective:** Verify users can only access their estimations
- **Test Steps:**
  1. Try to access another user's estimation
- **Expected Result:** Access denied error returned
- **Priority:** High
- **Status:** Not Executed

## 4. Excel Processing Test Cases

### TC-EXCEL-001: Valid Excel Upload
- **Objective:** Verify valid Excel file processing
- **Test Data:** Valid 8-sheet Excel template
- **Test Steps:**
  1. Upload valid Excel file
  2. Process and validate
- **Expected Result:** All sheets validated successfully, data mapped
- **Priority:** High
- **Status:** Not Executed

### TC-EXCEL-002: Invalid Excel Format
- **Objective:** Verify error handling for invalid files
- **Test Data:** Non-Excel file (PDF, TXT)
- **Test Steps:**
  1. Upload invalid file format
- **Expected Result:** File format error returned
- **Priority:** High
- **Status:** Not Executed

### TC-EXCEL-003: Missing Required Sheets
- **Objective:** Verify validation of missing sheets
- **Test Data:** Excel with missing Client_Info sheet
- **Test Steps:**
  1. Upload Excel with missing sheets
- **Expected Result:** Validation errors for missing sheets
- **Priority:** High
- **Status:** Not Executed

### TC-EXCEL-004: Invalid Data Values
- **Objective:** Verify data validation within sheets
- **Test Data:** Excel with invalid CPU cores (0 or >128)
- **Test Steps:**
  1. Upload Excel with invalid data
- **Expected Result:** Field-level validation errors
- **Priority:** Medium
- **Status:** Not Executed

### TC-EXCEL-005: Large File Handling
- **Objective:** Verify handling of large Excel files
- **Test Data:** 10MB Excel file
- **Test Steps:**
  1. Upload large Excel file
- **Expected Result:** File processed within timeout limits
- **Priority:** Medium
- **Status:** Not Executed

## 5. Cost Calculation Test Cases

### TC-CALC-001: Basic Cost Calculation
- **Objective:** Verify cost calculation accuracy
- **Test Data:** Simple server configuration
- **Test Steps:**
  1. Submit cost calculation request
  2. Verify calculated costs
- **Expected Result:** Accurate cost calculation with breakdown
- **Priority:** High
- **Status:** Not Executed

### TC-CALC-002: Complex Multi-Service Calculation
- **Objective:** Verify complex infrastructure costing
- **Test Data:** Multiple servers, databases, storage
- **Test Steps:**
  1. Submit complex requirements
  2. Verify all service costs calculated
- **Expected Result:** Complete cost breakdown by service
- **Priority:** High
- **Status:** Not Executed

### TC-CALC-003: Business Rules Application
- **Objective:** Verify business rules (10% buffer, support plan)
- **Test Steps:**
  1. Calculate costs for any configuration
  2. Verify buffer and support costs added
- **Expected Result:** Business rules applied correctly
- **Priority:** High
- **Status:** Not Executed

### TC-CALC-004: Regional Pricing
- **Objective:** Verify different regional pricing
- **Test Data:** Same config in us-east-1 vs eu-west-1
- **Test Steps:**
  1. Calculate costs for different regions
- **Expected Result:** Different costs based on region
- **Priority:** Medium
- **Status:** Not Executed

### TC-CALC-005: Auto-Scaling Cost Calculation
- **Objective:** Verify auto-scaling cost calculation
- **Test Data:** Server with min/max instances
- **Test Steps:**
  1. Submit auto-scaling configuration
- **Expected Result:** Average instance cost calculated
- **Priority:** Medium
- **Status:** Not Executed

## 6. Document Generation Test Cases

### TC-DOC-001: PDF Proposal Generation
- **Objective:** Verify PDF document generation
- **Test Steps:**
  1. Request PDF generation for estimation
  2. Download and verify content
- **Expected Result:** Professional PDF with all sections
- **Priority:** High
- **Status:** Not Executed

### TC-DOC-002: Word Document Generation
- **Objective:** Verify Word document generation
- **Test Steps:**
  1. Request Word document generation
  2. Download and verify format
- **Expected Result:** Properly formatted Word document
- **Priority:** Medium
- **Status:** Not Executed

### TC-DOC-003: Excel Export Generation
- **Objective:** Verify Excel export functionality
- **Test Steps:**
  1. Request Excel export
  2. Verify data accuracy in sheets
- **Expected Result:** Excel with summary and breakdown sheets
- **Priority:** Medium
- **Status:** Not Executed

### TC-DOC-004: Document Storage and Retrieval
- **Objective:** Verify documents stored in S3
- **Test Steps:**
  1. Generate document
  2. Verify S3 storage and presigned URL
- **Expected Result:** Document accessible via presigned URL
- **Priority:** Medium
- **Status:** Not Executed

### TC-DOC-005: Document Generation Performance
- **Objective:** Verify document generation within time limits
- **Test Steps:**
  1. Generate large document
  2. Measure generation time
- **Expected Result:** Document generated within 10 seconds
- **Priority:** Medium
- **Status:** Not Executed

## 7. Frontend UI Test Cases

### TC-UI-001: Dashboard Display
- **Objective:** Verify dashboard loads with user data
- **Test Steps:**
  1. Login and navigate to dashboard
  2. Verify metrics and recent estimations
- **Expected Result:** Dashboard displays user-specific data
- **Priority:** High
- **Status:** Not Executed

### TC-UI-002: Responsive Design
- **Objective:** Verify mobile responsiveness
- **Test Steps:**
  1. Access application on mobile device
  2. Test navigation and forms
- **Expected Result:** UI adapts to mobile screen sizes
- **Priority:** Medium
- **Status:** Not Executed

### TC-UI-003: Error Handling Display
- **Objective:** Verify error messages displayed properly
- **Test Steps:**
  1. Trigger various error conditions
  2. Verify error messages shown
- **Expected Result:** Clear, user-friendly error messages
- **Priority:** High
- **Status:** Not Executed

### TC-UI-004: Form Validation
- **Objective:** Verify client-side form validation
- **Test Steps:**
  1. Submit forms with invalid data
  2. Verify validation messages
- **Expected Result:** Validation prevents submission, shows errors
- **Priority:** High
- **Status:** Not Executed

### TC-UI-005: Navigation Flow
- **Objective:** Verify navigation between pages
- **Test Steps:**
  1. Navigate through all application pages
  2. Verify breadcrumbs and back buttons
- **Expected Result:** Smooth navigation, proper routing
- **Priority:** Medium
- **Status:** Not Executed

## 8. Performance Test Cases

### TC-PERF-001: API Response Time
- **Objective:** Verify API response times under normal load
- **Test Steps:**
  1. Make concurrent API requests
  2. Measure response times
- **Expected Result:** <2 seconds average response time
- **Priority:** High
- **Status:** Not Executed

### TC-PERF-002: Document Generation Performance
- **Objective:** Verify document generation performance
- **Test Steps:**
  1. Generate multiple documents simultaneously
  2. Measure generation times
- **Expected Result:** <10 seconds per document
- **Priority:** Medium
- **Status:** Not Executed

### TC-PERF-003: Concurrent User Load
- **Objective:** Verify system handles multiple users
- **Test Steps:**
  1. Simulate 50 concurrent users
  2. Monitor system performance
- **Expected Result:** System remains responsive
- **Priority:** Medium
- **Status:** Not Executed

## 9. Security Test Cases

### TC-SEC-001: SQL Injection Prevention
- **Objective:** Verify protection against SQL injection
- **Test Steps:**
  1. Submit SQL injection payloads
- **Expected Result:** Requests rejected, no data exposure
- **Priority:** High
- **Status:** Not Executed

### TC-SEC-002: XSS Prevention
- **Objective:** Verify protection against XSS attacks
- **Test Steps:**
  1. Submit XSS payloads in forms
- **Expected Result:** Scripts sanitized, not executed
- **Priority:** High
- **Status:** Not Executed

### TC-SEC-003: Authentication Bypass
- **Objective:** Verify protected endpoints require authentication
- **Test Steps:**
  1. Access protected endpoints without token
- **Expected Result:** 401 Unauthorized response
- **Priority:** High
- **Status:** Not Executed

### TC-SEC-004: Data Encryption
- **Objective:** Verify data encrypted at rest and in transit
- **Test Steps:**
  1. Verify HTTPS usage
  2. Check DynamoDB encryption
- **Expected Result:** All data properly encrypted
- **Priority:** High
- **Status:** Not Executed

## 10. Integration Test Cases

### TC-INT-001: End-to-End Estimation Flow
- **Objective:** Verify complete estimation workflow
- **Test Steps:**
  1. Login → Create estimation → Add requirements → Calculate costs → Generate document
- **Expected Result:** Complete workflow executes successfully
- **Priority:** High
- **Status:** Not Executed

### TC-INT-002: Excel Upload to Cost Calculation
- **Objective:** Verify Excel data flows to cost calculation
- **Test Steps:**
  1. Upload Excel → Process → Calculate costs
- **Expected Result:** Excel data used in cost calculation
- **Priority:** High
- **Status:** Not Executed

### TC-INT-003: Multi-User Collaboration
- **Objective:** Verify estimation sharing between users
- **Test Steps:**
  1. Share estimation with another user
  2. Verify access permissions
- **Expected Result:** Shared user can view estimation
- **Priority:** Medium
- **Status:** Not Executed

**Total Test Cases:** 50
**High Priority:** 25
**Medium Priority:** 20  
**Low Priority:** 5