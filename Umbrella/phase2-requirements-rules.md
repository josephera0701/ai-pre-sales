# Phase 2: Requirements Analysis AI Rules

## MANDATORY INPUTS
- Project charter (from Phase 1)
- Initial timeline (from Phase 1)
- Stakeholder map (from Phase 1)

## PROCESSING RULES
1. Extract functional requirements from business needs
2. Generate user stories with acceptance criteria
3. Include input validation for all data entry points
4. Define error handling for all scenarios
5. Specify security requirements for all features
6. Create traceability matrix linking requirements to business objectives

## MANDATORY OUTPUTS
- Requirements specification (functional, non-functional, constraints)
- User stories (As a... I want... So that... format)
- Acceptance criteria (Given... When... Then... format)

## VALIDATION CRITERIA
- All user stories have clear acceptance criteria
- Input validation specified for all user inputs
- Error handling defined for all failure scenarios
- Security requirements address identified threats
- Requirements are testable and measurable

## GENERAL RULES
- Always reference inputs from Phase 1
- Ensure outputs meet validation criteria
- Maintain traceability from requirements to business objectives
- Apply security considerations at every feature
- If inputs are incomplete, request missing information
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `2-Requirements/` folder before starting
- Place all outputs in `2-Requirements/` folder
- Use naming convention: requirements-specification.md, user-stories.md, acceptance-criteria.md
- Reference Phase 1 files using: `../1-Planning/[filename]`
- Verify folder structure before completing phase