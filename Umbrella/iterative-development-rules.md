# Iterative Development Rules (Phases 4-6)

## CORE PRINCIPLE
Phases 4-6 execute iteratively per component: Develop → Test → Deploy → Validate

## EXECUTION MODEL

### Component Flow
1. **Phase 4**: Develop component with tests/docs
2. **Phase 5**: Test component (unit, integration, security)
3. **Phase 6**: Deploy component to staging/production
4. **Validate**: Monitor performance, then next component

### Parallel Processing
- Multiple components in different phases simultaneously
- Foundation components deployed first
- Integration testing runs continuously

## QUALITY GATES
- **Dev→Test**: Complete src/, tests/, docs/ structure
- **Test→Deploy**: All test types pass
- **Deploy→Prod**: Performance criteria met

## FOLDER STRUCTURE
```
4-Development/components/[name]/{src,tests,docs}
5-Testing/component-tests/[name]/
6-Deployment/deployed-components/[name]/
```

## SESSION TRACKING
- Component status in SESSION-STATUS.md
- Dependency mapping and deployment order
- Rollback procedures per component

## BENEFITS
- Faster feedback per component
- Reduced deployment risk
- Continuous value delivery
- Parallel development capability