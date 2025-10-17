# Wireframes: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Login Page Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                    Sagesoft Solutions                       │
│                 AWS Cost Estimation Platform                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                     │
│                    │   Company Logo  │                     │
│                    └─────────────────┘                     │
│                                                             │
│                      Welcome Back                          │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │ Email Address               │               │
│              │ [____________________]      │               │
│              └─────────────────────────────┘               │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │ Password                    │               │
│              │ [____________________] 👁   │               │
│              └─────────────────────────────┘               │
│                                                             │
│              [ ] Remember me                                │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │        LOGIN                │               │
│              └─────────────────────────────┘               │
│                                                             │
│                   Forgot Password?                         │
│                                                             │
│              Need help? Contact Support                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Company branding at top
- Clean, centered login form
- Password visibility toggle
- Remember me option
- Forgot password link
- Support contact information

## 2. Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] AWS Cost Platform    [🔔] [👤 John Doe ▼] [Logout]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, John! 👋                                    │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Total Projects  │ │ This Month      │ │ Active Users  │ │
│  │      15         │ │   $125,000      │ │      8        │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Quick Actions                              │ │
│  │                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │  📊 New         │  │  📋 My          │             │ │
│  │  │  Estimation     │  │  Estimations    │             │ │
│  │  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Recent Estimations                              [View All] │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ABC Corp Infrastructure    $8,500/mo    Jan 15  [View] │ │
│  │ XYZ Migration Project     $12,300/mo    Jan 14  [View] │ │
│  │ DEF Startup Platform       $3,200/mo    Jan 13  [View] │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Top navigation with user menu
- Welcome message with user name
- Key metrics cards
- Quick action buttons
- Recent estimations list
- Responsive design indicators

## 3. Input Method Selection Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] New Estimation                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                Choose Input Method                          │
│                                                             │
│  How would you like to provide the requirements?           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                📄 Excel Upload                          │ │
│  │                                                         │ │
│  │  Upload our standardized Excel template with           │ │
│  │  client requirements already filled out.               │ │
│  │                                                         │ │
│  │  ✓ Faster for existing client data                     │ │
│  │  ✓ Bulk import of multiple servers                     │ │
│  │  ✓ Validation and error checking                       │ │
│  │                                                         │ │
│  │              [Choose Excel Upload]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                ✏️ Manual Entry                          │ │
│  │                                                         │ │
│  │  Fill out requirements using our guided               │ │
│  │  step-by-step form interface.                         │ │
│  │                                                         │ │
│  │  ✓ No file preparation needed                          │ │
│  │  ✓ Real-time cost calculations                         │ │
│  │  ✓ Built-in help and guidance                          │ │
│  │                                                         │ │
│  │              [Choose Manual Entry]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Download Template]                      │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Clear method comparison
- Benefits listed for each option
- Visual icons for differentiation
- Template download option
- Back navigation

## 4. Excel Upload Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Excel Upload                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Upload Excel Template                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │           📁 Drag & Drop Excel File Here               │ │
│  │                      or                                 │ │
│  │              [Browse Files]                             │ │
│  │                                                         │ │
│  │  Supported formats: .xlsx, .xls (Max 10MB)             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📋 Validation Results                                   │ │
│  │                                                         │ │
│  │ ✅ Client_Info              - Valid                     │ │
│  │ ✅ Compute_Requirements     - Valid (3 servers)         │ │
│  │ ✅ Storage_Requirements     - Valid (2 types)           │ │
│  │ ⚠️  Database_Requirements   - Warning (see details)     │ │
│  │ ✅ Security_Compliance      - Valid                     │ │
│  │                                                         │ │
│  │ [View Details] [Fix Issues]                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Continue] [Start Over]                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Drag and drop upload area
- File format and size restrictions
- Real-time validation results
- Color-coded status indicators
- Action buttons for next steps

## 5. Manual Entry Form Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Manual Entry                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Progress: ●●●○○○○ (3 of 7 sections complete)               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Client Information                                      │ │
│ │                                                         │ │
│ │ Company Name *        [ABC Corporation            ]     │ │
│ │ Industry *            [E-commerce ▼              ]     │ │
│ │ Primary Contact *     [Jane Smith                ]     │ │
│ │ Email *               [jane@abc.com              ]     │ │
│ │ Phone                 [+1-555-0123               ]     │ │
│ │ Timeline *            [Q2 2024 ▼                 ]     │ │
│ │ Budget Range          [$50K-$100K ▼              ]     │ │
│ │                                                         │ │
│ │ Compliance Requirements:                                │ │
│ │ ☑ SOC2    ☑ PCI-DSS    ☐ HIPAA    ☐ GDPR             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💰 Current Estimate: $8,500/month                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Save Draft] [Previous] [Next]                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Progress indicator
- Required field markers (*)
- Dropdown menus for selections
- Checkbox groups for multiple selections
- Real-time cost estimate
- Navigation and save options

## 6. Cost Calculation Results Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Cost Calculation Results                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ABC Corporation - AWS Cost Estimate                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 💰 Total Monthly Cost: $8,500                          │ │
│  │ 📅 Total Annual Cost:  $102,000                        │ │
│  │ 🌍 Region: US East (N. Virginia)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Cost Breakdown                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Compute (EC2)        $4,500  ████████████████████  53% │ │
│  │ Database (RDS)       $2,000  ████████             24% │ │
│  │ Storage (EBS/S3)     $1,200  █████                14% │ │
│  │ Network & CDN        $500    ██                    6% │ │
│  │ Security Services    $300    █                     3% │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  💡 Recommendations                                         │
│  • Consider Reserved Instances for 40% savings on compute  │
│  • Use S3 Intelligent Tiering for storage optimization     │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │   📊 Compare    │ │  📄 Generate    │ │  💾 Save      │ │
│  │ Configurations  │ │   Document      │ │ Estimation    │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Prominent total cost display
- Visual cost breakdown with percentages
- Optimization recommendations
- Action buttons for next steps
- Clear data visualization

## 7. Document Generation Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Generate Document                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Create Professional Proposal                              │
│                                                             │
│  Document Type                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ● PDF Proposal (Client-facing)                          │ │
│  │ ○ Word Document (Internal collaboration)                │ │
│  │ ○ Excel Export (Detailed analysis)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Options                                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ☑ Include Executive Summary                             │ │
│  │ ☑ Include Detailed Cost Breakdown                      │ │
│  │ ☐ Include Architecture Diagram                         │ │
│  │ ☑ Include Recommendations                               │ │
│  │ ☑ Include Terms and Disclaimers                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Branding                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Template: [Sagesoft Standard ▼]                         │ │
│  │ Logo: [Current Logo ▼]                                  │ │
│  │ Colors: [Corporate Theme ▼]                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Preview] [Generate Document]                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Document type selection
- Customizable content options
- Branding configuration
- Preview functionality
- Generate action button

## 8. Estimation List Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ My Estimations                              [+ New]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Search estimations...] [Filter ▼] [Sort: Date ▼]      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ABC Corporation Infrastructure              Jan 15, 2024 │ │
│ │ E-commerce platform migration                           │ │
│ │ 💰 $8,500/month  📊 Active  👥 Shared with 2           │ │
│ │                                                         │ │
│ │ [View] [Edit] [Clone] [Generate] [Share] [⋮]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ XYZ Corp Migration Project              Jan 14, 2024    │ │
│ │ Legacy system modernization                             │ │
│ │ 💰 $12,300/month  📊 Draft  👤 Private                 │ │
│ │                                                         │ │
│ │ [View] [Edit] [Clone] [Generate] [Share] [⋮]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ DEF Startup Platform                    Jan 13, 2024    │ │
│ │ New product launch infrastructure                       │ │
│ │ 💰 $3,200/month  📊 Archived  👤 Private               │ │
│ │                                                         │ │
│ │ [View] [Edit] [Clone] [Generate] [Share] [⋮]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Load More] (15 of 47)                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Search and filter functionality
- Estimation cards with key information
- Status indicators and sharing info
- Action buttons for each estimation
- Pagination controls

## 9. User Profile Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [←] User Profile                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐  John Doe                              │
│ │                 │  Sales Representative                   │
│ │   [👤 Photo]    │  john.doe@sagesoft.com                │
│ │                 │  Member since: Jan 2024                │
│ └─────────────────┘                                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Personal Information                                    │ │
│ │                                                         │ │
│ │ First Name        [John                    ] [Edit]     │ │
│ │ Last Name         [Doe                     ] [Edit]     │ │
│ │ Email             [john.doe@sagesoft.com   ] [Edit]     │ │
│ │ Phone             [+1-555-0123             ] [Edit]     │ │
│ │ Department        [Sales                   ] [Edit]     │ │
│ │ Role              [Sales Representative    ] [View]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Preferences                                             │ │
│ │                                                         │ │
│ │ Default Currency  [USD ▼                  ] [Save]     │ │
│ │ Default Region    [US East (N. Virginia) ▼] [Save]     │ │
│ │ Email Notifications [Enabled ▼           ] [Save]     │ │
│ │ Theme             [Light ▼                ] [Save]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Change Password] [Download Data]              │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Profile photo and basic info
- Editable personal information
- User preferences and settings
- Security and data options
- Role and permission display

## 10. Mobile Responsive Wireframes

### 10.1 Mobile Dashboard
```
┌─────────────────────┐
│ ☰  AWS Cost  🔔 👤 │
├─────────────────────┤
│                     │
│ Welcome, John! 👋   │
│                     │
│ ┌─────────────────┐ │
│ │ Total Projects  │ │
│ │      15         │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ This Month      │ │
│ │   $125,000      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 📊 New          │ │
│ │ Estimation      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 📋 My           │ │
│ │ Estimations     │ │
│ └─────────────────┘ │
│                     │
│ Recent Projects     │
│ ┌─────────────────┐ │
│ │ ABC Corp        │ │
│ │ $8,500/mo       │ │
│ │ [View]          │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### 10.2 Mobile Form
```
┌─────────────────────┐
│ [←] Client Info     │
├─────────────────────┤
│                     │
│ Step 1 of 6         │
│ ●○○○○○              │
│                     │
│ Company Name *      │
│ ┌─────────────────┐ │
│ │ABC Corporation  │ │
│ └─────────────────┘ │
│                     │
│ Industry *          │
│ ┌─────────────────┐ │
│ │E-commerce    ▼ │ │
│ └─────────────────┘ │
│                     │
│ Primary Contact *   │
│ ┌─────────────────┐ │
│ │Jane Smith       │ │
│ └─────────────────┘ │
│                     │
│ Email *             │
│ ┌─────────────────┐ │
│ │jane@abc.com     │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │      Next       │ │
│ └─────────────────┘ │
│                     │
│ [Save Draft]        │
└─────────────────────┘
```

**Mobile Design Principles:**
- Single column layout
- Large touch targets (44px minimum)
- Simplified navigation
- Progressive disclosure
- Thumb-friendly button placement

## 11. Error State Wireframes

### 11.1 Validation Error
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Client Information                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ Please fix the following errors:                         │
│                                                             │
│ Company Name *        [                           ]         │
│ ❌ Company name is required                                 │
│                                                             │
│ Email *               [invalid-email              ]         │
│ ❌ Please enter a valid email address                       │
│                                                             │
│ Phone                 [123                        ]         │
│ ⚠️ Phone number should include area code                    │
│                                                             │
│              [Fix Errors] [Save Draft]                      │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Network Error
```
┌─────────────────────────────────────────────────────────────┐
│                    Connection Error                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        🌐❌                                 │
│                                                             │
│              Unable to connect to server                    │
│                                                             │
│  Your internet connection appears to be offline or          │
│  our servers are temporarily unavailable.                   │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │        Try Again            │               │
│              └─────────────────────────────┘               │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │      Work Offline           │               │
│              └─────────────────────────────┘               │
│                                                             │
│                   Contact Support                          │
└─────────────────────────────────────────────────────────────┘
```

**Error Design Principles:**
- Clear error identification
- Helpful error messages
- Suggested solutions
- Recovery options
- Consistent error styling

These wireframes provide a comprehensive visual guide for implementing the AWS Cost Estimation Platform user interface, ensuring consistency, usability, and accessibility across all screens and devices.