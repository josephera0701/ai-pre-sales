# AI-SDLC Component-Based File Organization Rules

## MANDATORY FOLDER STRUCTURE (Component-Based Iterative Framework)

```
project-root/
├── 1-Planning/
│   ├── project-charter.md
│   ├── initial-timeline.md
│   ├── stakeholder-map.md
│   └── risk-assessment.md
├── 2-Requirements/
│   ├── requirements-specification.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   ├── traceability-matrix.md
│   └── input/
├── 3-Design/
│   ├── system-architecture.md
│   ├── database-schema.md
│   ├── api-specifications.md
│   └── architecture-diagrams/
├── 4-Development/
│   ├── component-breakdown.md
│   └── components/
│       ├── [component-name]/
│       │   ├── src/
│       │   ├── tests/
│       │   ├── docs/
│       │   └── package.json
│       └── [next-component]/
├── 5-Testing/
│   ├── component-tests/
│   │   └── [component-name]/
│   │       ├── test-plan.md
│   │       ├── test-[component-name].sh
│   │       └── test-results-*.json
│   ├── integration-tests/
│   └── deployment-readiness/
├── 6-Deployment/
│   ├── components/
│   │   └── [component-name]/
│   │       ├── template.yaml
│   │       ├── deploy-[component-name].sh
│   │       └── deployment-status.md
│   └── deployed-components/
│       └── [component-name]/
│           └── deployment-status.md
├── 7-Maintenance/
│   ├── performance-reports.md
│   ├── user-feedback.md
│   ├── enhancement-requests.md
│   └── maintenance-log.md
├── Umbrella/
│   └── [Framework files]
└── SESSION-STATUS.md
```

## COMPONENT-BASED ORGANIZATION RULES

### Phase 1-3: Traditional Structure (✅ Current Implementation)
- **Phases 1-3** follow traditional single-phase completion
- All files placed directly in phase folders
- Cross-phase references using relative paths

### Phase 4-6: Component-Based Iterative Structure (✅ Current Implementation)
- **Each component** goes through its own Phase 4→5→6 cycle
- **Independent development** allows parallel component work
- **Component isolation** enables focused testing and deployment

## COMPONENT FOLDER STRUCTURE

### Phase 4 - Development Components
```
4-Development/
├── component-breakdown.md (overall architecture)
└── components/
    ├── auth-service/
    │   ├── src/index.js
    │   ├── tests/auth.test.js
    │   ├── docs/README.md
    │   └── package.json
    ├── user-management-service/
    │   ├── src/index.js
    │   ├── tests/user-management.test.js
    │   ├── docs/README.md
    │   └── package.json
    └── [next-component]/
```

### Phase 5 - Testing Components
```
5-Testing/
├── component-tests/
│   ├── auth-service/
│   │   ├── test-plan.md
│   │   ├── test-auth-service.sh
│   │   └── test-results-*.json
│   ├── user-management-service/
│   │   ├── test-plan.md
│   │   ├── test-user-management-service.sh
│   │   └── test-results-*.json
│   └── [next-component]/
├── integration-tests/
└── deployment-readiness/
```

### Phase 6 - Deployment Components
```
6-Deployment/
├── components/
│   ├── auth-service/
│   │   ├── template.yaml
│   │   ├── deploy-auth-service.sh
│   │   └── deployment-status.md
│   ├── user-management-service/
│   │   ├── template.yaml
│   │   ├── deploy-user-management.sh
│   │   └── deployment-status.md
│   └── [next-component]/
└── deployed-components/
    ├── auth-service/
    │   └── deployment-status.md
    ├── user-management-service/
    │   └── deployment-status.md
    └── [next-component]/
```

## FILE NAMING CONVENTIONS

### Component Files:
- **Component folders:** `kebab-case` (e.g., `user-management-service`)
- **Source files:** `index.js` (main entry point)
- **Test files:** `[component-name].test.js`
- **Documentation:** `README.md`
- **Scripts:** `test-[component-name].sh`, `deploy-[component-name].sh`

### Status Files:
- **Test results:** `test-results-YYYYMMDD-HHMMSS.json`
- **Deployment status:** `deployment-status.md`
- **Component plans:** `test-plan.md`

## COMPONENT LIFECYCLE RULES

### Component Development Flow:
1. **Create component folder** in `4-Development/components/[component-name]/`
2. **Implement source code** in `src/` subfolder
3. **Create unit tests** in `tests/` subfolder
4. **Document component** in `docs/` subfolder
5. **Move to testing phase** - create `5-Testing/component-tests/[component-name]/`
6. **Execute comprehensive tests** and generate results
7. **Move to deployment phase** - create `6-Deployment/components/[component-name]/`
8. **Deploy to staging/production** and track status

### Component Independence:
- **Each component** can be at different phases simultaneously
- **No cross-component dependencies** in file structure
- **Independent testing** and deployment cycles
- **Parallel development** of multiple components

## VALIDATION CHECKLIST

### Component Structure Validation:
1. ✅ Component has `src/`, `tests/`, `docs/` subfolders
2. ✅ Component has proper test coverage and documentation
3. ✅ Component testing folder exists with test plan and scripts
4. ✅ Component deployment folder exists with templates and scripts
5. ✅ Component status tracked in deployment-status.md

### Cross-Phase References:
- Use relative paths: `../../../4-Development/components/[component-name]/`
- Document component dependencies in SESSION-STATUS.md
- Maintain component traceability across phases

## CURRENT IMPLEMENTATION STATUS: ✅ COMPLIANT

The current project structure **perfectly follows** this component-based organization:
- ✅ Phases 1-3: Traditional structure complete
- ✅ Phase 4: Component-based development with 2 components
- ✅ Phase 5: Component-specific testing with comprehensive test suites
- ✅ Phase 6: Component-specific deployment with AWS integration
- ✅ Component independence: Each component has complete Phase 4-6 cycle

## FRAMEWORK BENEFITS

### Achieved Benefits:
1. **Parallel Development:** Multiple components can be developed simultaneously
2. **Independent Testing:** Each component has isolated test environment
3. **Incremental Deployment:** Components can be deployed independently
4. **Clear Organization:** Component boundaries are well-defined
5. **Scalable Structure:** Easy to add new components without affecting existing ones