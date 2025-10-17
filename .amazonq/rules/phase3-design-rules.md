# Phase 3: System Design AI Rules

## MANDATORY INPUTS
- Requirements specification (from Phase 2)
- User stories (from Phase 2)
- Acceptance criteria (from Phase 2)

## PROCESSING RULES
1. Design system architecture following specified technology stack
2. Create database schema with proper normalization
3. Design API specifications with clear endpoints
4. Apply security architecture patterns
5. Ensure scalability for specified performance requirements
6. Design for specified integration requirements

## MANDATORY OUTPUTS
- Technical design documents (architecture, components, interfaces)
- Architecture diagrams (system, database, API)

## VALIDATION CRITERIA
- Architecture supports all functional requirements
- Database design is normalized and efficient
- API design follows RESTful principles
- Security architecture addresses all threats
- Design supports specified performance requirements
- All integrations are clearly defined

## GENERAL RULES
- Always reference inputs from Phase 2
- Ensure outputs meet validation criteria
- Apply security architecture patterns
- Design for scalability and performance
- If requirements are unclear, request clarification
- Prioritize editing existing files over creating new ones
- Remove unnecessary files after each iteration

## CONTEXT MANAGEMENT
- At session end: Create/update SESSION-STATUS.md with current progress
- At session start: Review SESSION-STATUS.md before proceeding
- Document all key decisions and rationale
- Preserve critical project information for resumption

## FILE ORGANIZATION
- Create `3-Design/` folder before starting
- Create `3-Design/architecture-diagrams/` subfolder for visual diagrams
- Place all outputs in `3-Design/` folder
- Use naming convention: system-architecture.md, database-schema.md, api-specifications.md
- Reference Phase 2 files using: `../2-Requirements/[filename]`
- Verify folder structure before completing phase