# AI-SDLC File Organization Rules

## MANDATORY FOLDER STRUCTURE

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
│   └── traceability-matrix.md
├── 3-Design/
│   ├── system-architecture.md
│   ├── database-schema.md
│   ├── api-specifications.md
│   └── architecture-diagrams/
├── 4-Development/
│   ├── src/
│   ├── tests/
│   ├── docs/
│   └── README.md
├── 5-Testing/
│   ├── test-plan.md
│   ├── test-cases.md
│   ├── test-reports.md
│   ├── bug-reports.md
│   └── quality-metrics.md
├── 6-Deployment/
│   ├── deployment-config/
│   ├── ci-cd-setup.md
│   ├── monitoring-setup.md
│   └── deployment-guide.md
├── 7-Maintenance/
│   ├── performance-reports.md
│   ├── user-feedback.md
│   ├── enhancement-requests.md
│   └── maintenance-log.md
├── Umbrella/
│   └── [Framework files]
└── SESSION-STATUS.md
```

## FILE PLACEMENT RULES

### Phase 1 - Planning Files:
- **Folder:** `1-Planning/`
- **Files:** project-charter.md, initial-timeline.md, stakeholder-map.md

### Phase 2 - Requirements Files:
- **Folder:** `2-Requirements/`
- **Files:** requirements-specification.md, user-stories.md, acceptance-criteria.md

### Phase 3 - Design Files:
- **Folder:** `3-Design/`
- **Files:** system-architecture.md, database-schema.md, api-specifications.md, ui-flows.md, wireframes.md, data-interfaces.md
- **Subfolders:** 
  - `architecture-diagrams/` for system diagrams
  - `ui-flows/` for user journey maps and flow diagrams
  - `wireframes/` for UI mockups and wireframes
  - `data-interfaces/` for data format specifications

### Phase 4 - Development Files:
- **Folder:** `4-Development/`
- **Subfolders:** `src/` (source code), `tests/` (unit tests), `docs/` (code documentation)

### Phase 5 - Testing Files:
- **Folder:** `5-Testing/`
- **Files:** test-plan.md, test-cases.md, test-reports.md, bug-reports.md, quality-metrics.md

### Phase 6 - Deployment Files:
- **Folder:** `6-Deployment/`
- **Files:** ci-cd-setup.md, monitoring-setup.md, deployment-guide.md
- **Subfolder:** `deployment-config/` for configuration files

### Phase 7 - Maintenance Files:
- **Folder:** `7-Maintenance/`
- **Files:** performance-reports.md, user-feedback.md, enhancement-requests.md, maintenance-log.md

## FOLDER CREATION RULES

### Before Starting Each Phase:
1. **Check if phase folder exists**
2. **Create folder if missing:** `mkdir [phase-folder]`
3. **Verify folder permissions**
4. **Create required subfolders if specified**

### File Naming Conventions:
- Use lowercase with hyphens: `file-name.md`
- Include phase prefix for clarity: `phase1-project-charter.md` (if needed)
- Use descriptive names: `user-stories.md` not `stories.md`
- Date stamp for reports: `test-report-2024-01-15.md`

## CROSS-PHASE FILE REFERENCES

### When Referencing Files from Other Phases:
- Use relative paths: `../2-Requirements/user-stories.md`
- Always verify file exists before referencing
- Include phase number in reference for clarity
- Update SESSION-STATUS.md with file dependencies

### File Movement Rules:
- **Never move files between phase folders**
- **Copy files if needed in multiple phases**
- **Create symbolic links for shared resources**
- **Document all file relationships**

## VALIDATION CHECKLIST

### Before Completing Each Phase:
1. All required files are in correct phase folder
2. File naming follows conventions
3. No files are misplaced in wrong folders
4. All cross-references are valid
5. SESSION-STATUS.md reflects current file structure