# Phase 5: Testing & Quality Assurance AI Rules

## MANDATORY INPUTS
- Working application (from Phase 4)
- Unit tests (from Phase 4)
- Technical design documents (from Phase 3)

## PROCESSING RULES
1. Create component-specific test plans for independent testing
2. Generate test cases for each component (positive, negative, edge cases)
3. Execute component-level automated test suites
4. Perform integration testing between components
5. Conduct end-to-end testing for complete user journeys
6. Perform security testing for each component and integration points
7. Conduct performance testing for individual components and system
8. Document all bugs with component mapping and severity levels
9. Implement fixes and re-test affected components
10. Validate components are ready for independent deployment

## MANDATORY OUTPUTS
- Component-specific test plans and strategies
- Component test cases and integration test scenarios
- Component test reports with individual coverage metrics
- Integration test reports for component interactions
- End-to-end test reports for complete user journeys
- Component deployment readiness assessments
- Bug fixes with component impact analysis
- Quality metrics per component and overall system

## VALIDATION CRITERIA
- Each component has comprehensive test coverage (unit, integration, security)
- Components can be tested independently without dependencies
- Integration tests validate component interactions
- End-to-end tests cover complete user journeys
- All critical and high-severity bugs are fixed per component
- Performance meets requirements for individual components and system
- Security tests pass for each component and integration points
- Components are validated as deployment-ready
- Quality metrics meet standards for each component

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
- Create component-based testing structure:
  - `5-Testing/component-tests/` for individual component test results
  - `5-Testing/component-tests/[component-name]/` for each component's tests
  - `5-Testing/integration-tests/` for component integration test results
  - `5-Testing/end-to-end-tests/` for complete user journey tests
  - `5-Testing/performance-tests/` for component and system performance
  - `5-Testing/security-tests/` for component and system security
  - `5-Testing/deployment-readiness/` for component deployment assessments
- Use naming convention: component-test-plan.md, integration-test-plan.md, e2e-test-plan.md
- Reference Phase 4 files using: `../4-Development/[filename]`
- Reference Phase 3 files using: `../3-Design/[filename]`
- Verify folder structure before completing phase