# Phase 4: Development AI Rules

## MANDATORY INPUTS
- Technical design documents (from Phase 3)
- Architecture diagrams (from Phase 3)

## PROCESSING RULES
1. Break down system into independently deployable components
2. Prioritize components by business value and dependencies
3. Implement components incrementally with clear interfaces
4. Generate code following specified framework and standards
5. Create component-specific unit and integration tests
6. Include comprehensive error handling for each component
7. Apply secure coding practices
8. Document component APIs and dependencies
9. Ensure components can be tested and deployed independently

## MANDATORY OUTPUTS
- Component breakdown and dependency map
- Independently deployable components with clear interfaces
- Component-specific unit and integration tests
- Component documentation and API specifications
- Deployment-ready components with configuration

## VALIDATION CRITERIA
- Components are independently testable and deployable
- All user stories are mapped to specific components
- Component interfaces are well-defined and documented
- Each component has comprehensive test coverage
- Components can be deployed without breaking existing functionality
- Code follows specified standards and best practices
- Error handling covers all identified scenarios
- Security measures are properly implemented

## GENERAL RULES
- Always reference inputs from Phase 3
- Follow specified technology stack and frameworks
- Apply secure coding practices throughout
- Include comprehensive error handling
- Generate unit tests with adequate coverage
- Document all code and configurations
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `4-Development/` folder before starting
- Create component-based structure:
  - `4-Development/components/` for individual components
  - `4-Development/components/[component-name]/src/` for component source
  - `4-Development/components/[component-name]/tests/` for component tests
  - `4-Development/components/[component-name]/docs/` for component docs
  - `4-Development/shared/` for shared libraries and utilities
  - `4-Development/integration/` for integration tests
  - `4-Development/deployment/` for deployment configurations
- Create component-breakdown.md documenting all components and dependencies
- Reference Phase 3 files using: `../3-Design/[filename]`
- Verify folder structure before completing phase