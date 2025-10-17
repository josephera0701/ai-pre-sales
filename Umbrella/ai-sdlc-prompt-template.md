# AI-Driven SDLC Prompt Engineering Template

==================================================
1-PLANNING & INITIATION
==================================================

## 1.1 Business Opportunity:
1.1.1 [Define primary business objective and value proposition - e.g., "Create a personal finance management app to help users track spending"]
1.1.2 [Define target market and user base - e.g., "Individual users aged 25-45 who want better financial control"]
1.1.3 [Define business constraints and limitations - e.g., "Limited budget of $50K, 6-month timeline"]
1.1.4 [Define success metrics and KPIs - e.g., "1000 active users within 3 months, 90% user retention"]

## 1.2 Project Vision:
1.2.1 [Define project scope and boundaries - e.g., "Web-based application with mobile responsiveness, no mobile app"]
1.2.2 [Define key stakeholders and their roles - e.g., "Product Owner: John Doe, Developer: Jane Smith, Users: Beta testers"]
1.2.3 [Define project timeline and milestones - e.g., "Phase 1: 2 months, Phase 2: 3 months, Launch: Month 6"]
1.2.4 [Define budget and resource constraints - e.g., "$50K budget, 2 developers, cloud hosting only"]

## 1.3 Risk Assessment:
1.3.1 [Identify technical risks and mitigation strategies - e.g., "Database performance issues - use caching and optimization"]
1.3.2 [Identify business risks and contingency plans - e.g., "Low user adoption - implement referral program"]
1.3.3 [Define compliance and regulatory requirements - e.g., "GDPR compliance for EU users, PCI DSS for payments"]

**AI Task:** Conduct feasibility analysis, risk assessment, and resource estimation.
Generate project charter, initial timeline, and stakeholder map.
Include threat modeling and compliance requirements.
**Input:** Business opportunity, project vision, risk assessment
**Output:** Project charter, initial timeline, stakeholder map

==================================================
2-REQUIREMENTS ANALYSIS
==================================================

## 2.1 Business Requirements:
2.1.1 [Define primary business objective - e.g., "I need to track my incomes and expenses"]
2.1.2 [Define secondary business objectives - e.g., "I want to see top categories of expenses"]
2.1.3 [Define business constraints and limitations - e.g., "Must work offline, no third-party payment integrations"]

## 2.2 System Requirements:
2.2.1 [Define platform/device accessibility requirements - e.g., "The system user interface should be accessible via multiple devices"]
2.2.2 [Define authentication and authorization requirements - e.g., "The system should have a login for registered users and a sign-up for new users"]
2.2.3 [Define localization and internationalization requirements - e.g., "The system shall be localized to Philippines"]
2.2.4 [Define integration requirements with external systems - e.g., "Integration with bank APIs for transaction import"]

## 2.3 User Requirements:
2.3.1 [Define primary user interface requirements - e.g., "I should have a dashboard of cashflow daily, weekly and monthly"]
2.3.2 [Define user interaction and workflow requirements - e.g., "I should be able to enter income and expense transactions"]
2.3.3 [Define reporting and analytics requirements - e.g., "I should be able to generate reports based on selected date range"]
2.3.4 [Define user experience and usability requirements - e.g., "Interface should be intuitive for non-technical users"]

## 2.4 Functional Requirements:
2.4.1 [Define core functionality requirements - e.g., "I should be able to set the categories of income and expenses"]
2.4.2 [Define data management requirements - e.g., "I should be able to edit my entries"]
2.4.3 [Define business logic requirements - e.g., "System should calculate running balances automatically"]
2.4.4 [Define workflow and process requirements - e.g., "Monthly budget alerts when spending exceeds limits"]

## 2.5 Non-Functional Requirements:
2.5.1 [Define performance requirements or mark "NA" if not applicable - e.g., "Page load time under 2 seconds"]
2.5.2 [Define security requirements - e.g., "Data encryption at rest and in transit"]
2.5.3 [Define scalability requirements - e.g., "Support up to 10,000 concurrent users"]
2.5.4 [Define reliability and availability requirements - e.g., "99.9% uptime, automated backups"]

**AI Task:** Extract requirements, generate user stories, create acceptance criteria.
Include input validations, defaults, and error handling in user stories.
Include security requirements and privacy considerations.
**Input:** Project charter, initial timeline, stakeholder map
**Output:** Requirements specification, user stories, acceptance criteria

==================================================
3-SYSTEM DESIGN
==================================================

## 3.1 Technology Stack:
- **Operating System:** [Specify OS requirements - e.g., "Linux or Mac"]
- **Programming Language:** [List primary languages - e.g., "PHP, JS, CSS, HTML"]
- **Framework:** [Specify framework/libraries - e.g., "Laravel"]
- **Database:** [Specify database system - e.g., "MariaDB"]
- **Additional Tools:** [List additional technologies - e.g., "Docker, Redis, Nginx"]

## 3.2 User Interface Requirements:
- **Responsiveness:** [Define responsive design requirements - e.g., "UI must be reactive to user devices"]
- **Theme:** [Define visual design requirements - e.g., "UI theme must be professional and not too loud"]
- **Accessibility:** [Define accessibility standards - e.g., "UI should automatically be in dark mode when evening comes and light mode in the morning"]
- **User Experience:** [Define UX requirements - e.g., "Maximum 3 clicks to reach any feature, intuitive navigation"]

## 3.3 Security Requirements:
- **Authentication:** [Define authentication methods - e.g., "System should have a login to protect the information inside"]
- **Authorization:** [Define access control requirements - e.g., "Role-based access control with admin and user roles"]
- **Data Protection:** [Define data security measures - e.g., "AES-256 encryption, secure password hashing"]
- **Compliance:** [Define regulatory compliance needs - e.g., "GDPR compliance, data retention policies"]

## 3.4 Performance Requirements:
- **Response Time:** [Define performance benchmarks or mark "Not applicable"]
- **Throughput:** [Define capacity requirements or mark "Not applicable"]
- **Scalability:** [Define scaling requirements or mark "Not applicable"]

## 3.5 Integration Requirements:
- **APIs:** [Define API requirements or mark "Not applicable"]
- **Third-party Services:** [Define external integrations or mark "Not applicable"]
- **Data Exchange:** [Define data integration needs or mark "Not applicable"]

**AI Task:** Generate system architecture, API specs, database schema, UI flows, wireframes, data interfaces.
Apply software engineering best practices and security architecture.
**Input:** Requirements specification, user stories, acceptance criteria
**Output:** Technical design documents, architecture diagrams, UI flows, wireframes, data interface specifications

==================================================
4-DEVELOPMENT
==================================================

## 4.1 Development Guidelines:
- Follow requirements from previous phases
- Implement design specifications
- Apply coding best practices and standards [e.g., "PSR-12 for PHP, ESLint for JavaScript"]
- Include comprehensive error handling [e.g., "Try-catch blocks, user-friendly error messages"]
- Implement security measures as specified [e.g., "Input validation, SQL injection prevention"]

## 4.2 Code Generation Requirements:
- Generate complete application source code [e.g., "MVC structure with controllers, models, views"]
- Install and configure necessary dependencies [e.g., "Composer for PHP, npm for JavaScript"]
- Create database migrations and seeders [e.g., "Laravel migrations, sample data seeders"]
- Implement authentication and authorization [e.g., "Laravel Auth, JWT tokens"]
- Create responsive user interfaces [e.g., "Bootstrap 5, mobile-first design"]
- Include unit tests [e.g., "PHPUnit tests, 80% code coverage"]

## 4.3 Documentation Requirements:
- Generate API documentation [e.g., "Swagger/OpenAPI documentation"]
- Create installation guides [e.g., "Step-by-step setup instructions"]
- Document configuration procedures [e.g., "Environment variables, database setup"]
- Include code comments and README files [e.g., "Inline comments, comprehensive README"]

**AI Task:** Code generation, scaffolding, implementation, code review.
Apply secure coding practices and vulnerability scanning.
**Input:** Technical design documents, architecture diagrams
**Output:** Working application with unit tests

==================================================
5-TESTING & QUALITY ASSURANCE
==================================================

## 5.1 Testing Strategy:
- Create comprehensive test plan [e.g., "Test plan covering all user stories and edge cases"]
- Generate test cases based on user stories and requirements [e.g., "Positive, negative, and boundary test cases"]
- Create automated test suites for all functionality [e.g., "PHPUnit for backend, Jest for frontend"]
- Implement unit, integration, and end-to-end tests [e.g., "Unit tests for models, integration tests for APIs"]
- Include performance and security testing [e.g., "Load testing with 1000 concurrent users, OWASP security tests"]

## 5.2 Test Execution:
- Deploy application in local development environment [e.g., "Docker containers for consistent testing environment"]
- Execute automated test suites [e.g., "CI/CD pipeline with automated test execution"]
- Identify and document bugs and issues [e.g., "Bug tracking in Jira with severity levels"]
- Generate test coverage reports [e.g., "Code coverage reports with minimum 80% threshold"]

## 5.3 Bug Resolution:
- Analyze test failures and bugs [e.g., "Root cause analysis, impact assessment"]
- Implement fixes for identified issues [e.g., "Priority-based bug fixing, code review for fixes"]
- Re-run tests to verify fixes [e.g., "Regression testing, smoke tests"]
- Document all changes and fixes [e.g., "Change log, fix documentation"]

**AI Task:** Create test plan, generate test cases, run automated tests, detect bugs.
Include security testing and penetration testing.
**Input:** Working application, unit tests, technical design documents
**Output:** Test plan, test cases, test reports, bug fixes, quality metrics

**Database Credentials:** [Specify database connection details - e.g., "Username: root, Password: P@ssw0rd"]

==================================================
6-DEPLOYMENT & RELEASE
==================================================

## 6.1 Deployment Strategy:
- Create deployment configurations [e.g., "Docker compose files, Kubernetes manifests"]
- Set up CI/CD pipelines [e.g., "GitHub Actions, automated deployment on merge"]
- Configure production environment [e.g., "AWS EC2, load balancers, auto-scaling"]
- Implement monitoring and logging [e.g., "CloudWatch, application logs, error tracking"]

## 6.2 Infrastructure Requirements:
- Define server specifications [e.g., "2 CPU cores, 4GB RAM, 50GB SSD"]
- Configure web server settings [e.g., "Nginx with SSL certificates, gzip compression"]
- Set up database connections [e.g., "RDS MariaDB with read replicas"]
- Implement security configurations [e.g., "Firewall rules, VPC, security groups"]

## 6.3 Deployment Documentation:
- Create deployment guides [e.g., "Step-by-step deployment checklist"]
- Document configuration procedures [e.g., "Environment variables, SSL setup"]
- Include troubleshooting guides [e.g., "Common issues and solutions"]
- Provide rollback procedures [e.g., "Blue-green deployment, database rollback scripts"]

**AI Task:** Configure CI/CD, deploy, monitor.
Implement security monitoring and access controls.
**Input:** Tested application, test reports, quality metrics
**Output:** Production deployment, monitoring setup

==================================================
7-MAINTENANCE & EVOLUTION
==================================================

## 7.1 Maintenance Strategy:
- Monitor application performance [e.g., "Daily performance metrics, uptime monitoring"]
- Track user feedback and issues [e.g., "User feedback forms, support ticket system"]
- Plan feature enhancements [e.g., "Quarterly feature roadmap, user-requested features"]
- Manage technical debt [e.g., "Monthly code refactoring, dependency updates"]

## 7.2 Evolution Planning:
- Analyze usage patterns [e.g., "Google Analytics, user behavior tracking"]
- Identify improvement opportunities [e.g., "A/B testing, performance bottlenecks"]
- Plan version updates [e.g., "Semantic versioning, backward compatibility"]
- Manage end-of-life transitions [e.g., "Migration guides, deprecation notices"]

## 7.3 Support Documentation:
- Create user manuals [e.g., "Step-by-step user guides with screenshots"]
- Document troubleshooting procedures [e.g., "FAQ, common error solutions"]
- Maintain knowledge base [e.g., "Searchable documentation, video tutorials"]
- Provide training materials [e.g., "Onboarding guides, feature tutorials"]

**AI Task:** Monitor performance, analyze issues, suggest improvements.
Implement security updates and threat monitoring.
**Input:** Production deployment, monitoring setup, user feedback
**Output:** Updates, patches, enhancementsecurity updates and threat monitoring.
**Input:** Production deployment, monitoring setup, user feedback
**Output:** Updates, patches, enhancements

==================================================
PROMPT ENGINEERING NOTES
==================================================

## Usage Instructions:
- Fill in bracketed placeholders with specific requirements
- Remove or mark sections as "NA" if not applicable
- Provide specific technology stack and constraints
- Include any special requirements or limitations
- Specify database credentials and environment details
- Choose implementation approach (Waterfall/Agile/DevOps)

## AI Integration Points:
- Planning and feasibility analysis
- Requirements analysis and user story generation
- System design and architecture creation
- Code generation and implementation
- Test planning, case creation and execution
- Deployment configuration and monitoring
- Maintenance and evolution planning

## Best Practices:
- Be specific with requirements and constraints
- Include validation and error handling requirements
- Specify technology versions and compatibility
- Define clear acceptance criteria
- Include security and performance requirements
- Plan for iterative feedback and refinement
- Consider long-term maintenance and evolution