# Phase 6: Deployment & Release AI Rules

## MANDATORY INPUTS
- Tested application (from Phase 5)
- Test reports (from Phase 5)
- Quality metrics (from Phase 5)

## PROCESSING RULES
1. Create deployment configurations for target environment
2. Set up CI/CD pipelines with automated testing
3. Configure production environment with security measures
4. Implement monitoring and logging
5. Create deployment documentation
6. Establish rollback procedures

## MANDATORY OUTPUTS
- Production deployment (live application)
- Monitoring setup (performance, errors, security)

## VALIDATION CRITERIA
- Application deploys successfully to production
- All monitoring systems are functional
- Security configurations are properly implemented
- Rollback procedures are tested and documented
- Performance meets production requirements
- All integrations work in production environment

## GENERAL RULES
- Always reference inputs from Phase 5
- Ensure secure production configuration
- Implement comprehensive monitoring
- Document all deployment procedures
- Test rollback procedures
- Verify all integrations in production
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `6-Deployment/` folder before starting
- Create `6-Deployment/deployment-config/` subfolder for configuration files
- Place all outputs in `6-Deployment/` folder
- Use naming convention: ci-cd-setup.md, monitoring-setup.md, deployment-guide.md
- Reference Phase 5 files using: `../5-Testing/[filename]`
- Verify folder structure before completing phase