# Phase 3: System Design AI Rules

## MANDATORY INPUTS
- Requirements specification (from Phase 2)
- User stories (from Phase 2)
- Acceptance criteria (from Phase 2)

## PROCESSING RULES
1. Design system architecture following specified technology stack
2. Create database schema with proper normalization
3. Design API specifications with clear endpoints
4. Create UI flows and user journey maps
5. Design wireframes for all user interfaces
6. Design data interface specifications (input/output formats)
7. Apply security architecture patterns
8. Ensure scalability for specified performance requirements
9. Design for specified integration requirements

## MANDATORY OUTPUTS
- Technical design documents (architecture, components, interfaces)
- Architecture diagrams (system, database, API)
- UI flows and user journey maps
- Wireframes for all user interfaces
- Data interface specifications (input/output formats, validation rules)

## VALIDATION CRITERIA
- Architecture supports all functional requirements
- Database design is normalized and efficient
- API design follows RESTful principles
- UI flows cover all user stories and acceptance criteria
- Wireframes address all user interface requirements
- Data interfaces define clear input/output specifications
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
- Create subfolders:
  - `3-Design/architecture-diagrams/` for system diagrams
  - `3-Design/ui-flows/` for user journey maps and flow diagrams
  - `3-Design/wireframes/` for UI mockups and wireframes
  - `3-Design/data-interfaces/` for data format specifications
- Place all outputs in appropriate `3-Design/` subfolders
- Use naming convention: system-architecture.md, database-schema.md, api-specifications.md, ui-flows.md, wireframes.md, data-interfaces.md
- Reference Phase 2 files using: `../2-Requirements/[filename]`
- Verify folder structure before completing phase