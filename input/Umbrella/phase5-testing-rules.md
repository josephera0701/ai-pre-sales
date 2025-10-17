# Phase 5: Testing & Quality Assurance AI Rules

## MANDATORY INPUTS
- Working application (from Phase 4)
- Unit tests (from Phase 4)
- Technical design documents (from Phase 3)

## PROCESSING RULES
1. Create comprehensive test plan covering all user stories
2. Generate test cases for positive, negative, and edge cases
3. Execute automated test suites
4. Perform security testing
5. Conduct performance testing
6. Document all bugs with severity levels
7. Implement fixes and re-test

## MANDATORY OUTPUTS
- Test plan (strategy, scope, approach)
- Test cases (detailed test scenarios)
- Test reports (execution results, coverage)
- Bug fixes (code changes, documentation)
- Quality metrics (coverage, performance, security)

## VALIDATION CRITERIA
- Test plan covers all user stories and requirements
- Test coverage meets minimum threshold
- All critical and high-severity bugs are fixed
- Performance meets specified requirements
- Security tests pass all checks
- Quality metrics meet defined standards

## GENERAL RULES
- Always reference inputs from Phase 4 and Phase 3
- Create comprehensive test coverage
- Document all bugs with clear severity levels
- Implement fixes for all critical issues
- Re-test after implementing fixes
- Generate detailed quality metrics
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `5-Testing/` folder before starting
- Place all outputs in `5-Testing/` folder
- Use naming convention: test-plan.md, test-cases.md, test-reports.md, bug-reports.md, quality-metrics.md
- Reference Phase 4 files using: `../4-Development/[filename]`
- Reference Phase 3 files using: `../3-Design/[filename]`
- Verify folder structure before completing phase