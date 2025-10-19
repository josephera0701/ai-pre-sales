# Iterative Component Workflow (Phases 4-6)

## Component Lifecycle

### 1. Component Breakdown (Phase 4 Entry)
```bash
AI: "Break system into deployable components from Phase 3 design"
# Creates: 4-Development/component-breakdown.md
```

### 2. Per-Component Flow
**Development (Phase 4)**
```bash
# Create: 4-Development/components/[name]/{src,tests,docs}
AI: "Implement [component] with tests and documentation"
```

**Testing (Phase 5)**
```bash
# Immediate testing when development complete
AI: "Test [component] - unit, integration, security"
# Creates: 5-Testing/component-tests/[name]/
```

**Deployment (Phase 6)**
```bash
# Deploy when tests pass
AI: "Deploy [component] to staging/production"
# Creates: 6-Deployment/deployed-components/[name]/
```

### 3. Parallel Execution
- Component A: Deployed (Phase 6)
- Component B: Testing (Phase 5)
- Component C: Development (Phase 4)
- Component D: Planning

### 4. Integration Testing
```bash
AI: "Test component interactions"
# Creates: 5-Testing/integration-tests/
```

## Validation Commands
```bash
python 3-validate-phase.py
# Shows component status across phases
```

## Component Priority Order
1. **Infrastructure**: Auth, database, logging
2. **Core Features**: Main business logic
3. **Integrations**: External services
4. **Enhancements**: Optional features

## Quality Gates
- **Dev→Test**: Complete src/, tests/, docs/
- **Test→Deploy**: All tests pass
- **Deploy→Prod**: Performance validated

## Session Tracking
SESSION-STATUS.md tracks:
- Component phase status
- Dependencies and deployment order
- Current priorities and blockers