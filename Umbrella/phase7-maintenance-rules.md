# Phase 7: Maintenance & Evolution AI Rules

## MANDATORY INPUTS
- Production deployment (from Phase 6)
- Monitoring setup (from Phase 6)
- User feedback (ongoing)

## PROCESSING RULES
1. Monitor application performance continuously
2. Analyze user feedback and usage patterns
3. Identify improvement opportunities
4. Plan feature enhancements based on user needs
5. Manage technical debt and security updates
6. Document all changes and their impact

## MANDATORY OUTPUTS
- Updates (feature enhancements, bug fixes)
- Patches (security updates, critical fixes)
- Enhancements (performance improvements, new features)

## VALIDATION CRITERIA
- Performance monitoring shows stable operation
- User feedback is regularly collected and analyzed
- Security updates are applied promptly
- Feature enhancements align with user needs
- Technical debt is managed systematically
- All changes are properly documented and tested

## GENERAL RULES
- Always reference inputs from Phase 6
- Monitor performance continuously
- Prioritize security updates
- Analyze user feedback systematically
- Plan enhancements based on user needs
- Document all changes and their impact
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `7-Maintenance/` folder before starting
- Place all outputs in `7-Maintenance/` folder
- Use naming convention: performance-reports.md, user-feedback.md, enhancement-requests.md, maintenance-log.md
- Reference Phase 6 files using: `../6-Deployment/[filename]`
- Verify folder structure before completing phase