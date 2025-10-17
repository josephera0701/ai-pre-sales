# AI-SDLC Context Management Rules

## SESSION STATE TRACKING

### At End of Each Session:
1. **Create SESSION-STATUS.md** with:
   - Current phase and completion percentage
   - Last completed task/milestone
   - Next planned actions
   - Key decisions made
   - Issues encountered and resolutions
   - Files created/modified in this session

### At Start of Each Session:
1. **Review SESSION-STATUS.md** to understand current state
2. **Verify all inputs** from previous phases are available
3. **Confirm validation criteria** were met in previous tasks
4. **Check file structure** for any missing or corrupted files

## CONTEXT PRESERVATION FORMAT

### SESSION-STATUS.md Template:
```
# AI-SDLC Session Status

## Current State
- **Phase:** [Current phase number and name]
- **Progress:** [X% complete]
- **Last Task:** [Description of last completed task]
- **Session Date:** [YYYY-MM-DD]

## Completed This Session
- [List of completed tasks]
- [Files created/modified]
- [Key decisions made]

## Next Session Actions
- [Priority 1 task]
- [Priority 2 task]
- [Priority 3 task]

## Context Summary
- **Project:** [Brief project description]
- **Tech Stack:** [Key technologies]
- **Key Requirements:** [Top 3-5 requirements]
- **Current Issues:** [Any blockers or concerns]

## File Status
- **Inputs Available:** [List of input files]
- **Outputs Created:** [List of output files]
- **Next Inputs Needed:** [What's needed for next phase]
```

## RESUMPTION CHECKLIST

### Before Starting Work:
1. Read SESSION-STATUS.md completely
2. Verify all referenced files exist and are accessible
3. Review the last 3 key decisions made
4. Confirm understanding of current phase objectives
5. Check if any validation criteria were pending

### If Context is Lost:
1. Review all available files in chronological order
2. Reconstruct current state from file contents
3. Update SESSION-STATUS.md with reconstructed context
4. Proceed with caution and validate all assumptions

## BACKUP CONTEXT RULES

### Critical Information to Always Preserve:
- Project charter and core objectives
- Technology stack and constraints
- Key stakeholder decisions
- Security and compliance requirements
- Current phase validation criteria

### Recovery Strategies:
- If SESSION-STATUS.md is missing, create from available files
- If inputs are missing, request from user before proceeding
- If validation status is unclear, re-validate previous phase outputs
- If decisions are unclear, document assumptions and seek confirmation