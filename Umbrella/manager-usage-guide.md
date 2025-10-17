# AI-SDLC Manager Usage Guide

## Quick Start

### 1. Basic Project Setup

```python
from 1-start-project import ProjectConfig, AISDLCManager

# Define your project
config = ProjectConfig(
    name="my-web-app",
    description="E-commerce web application",
    tech_stack=["Python", "Django", "PostgreSQL", "React"],
    ai_tools={"assistant": "amazon-q", "code_review": "automated"}
)

# Initialize manager
manager = AISDLCManager(config, project_root="./my-project")

# Start project (creates folders and SESSION-STATUS.md)
result = manager.start_project()
print(result)
```

**Output:**
```json
{
  "project": "my-web-app",
  "phase": "planning",
  "phase_folder": "1-Planning",
  "actions": ["Create project charter", "Define timeline", "Map stakeholders"],
  "folder_structure_created": true
}
```

### 2. What Gets Created

```
my-project/
├── 1-Planning/
├── 2-Requirements/
├── 3-Design/
│   └── architecture-diagrams/
├── 4-Development/
│   ├── src/
│   ├── tests/
│   └── docs/
├── 5-Testing/
├── 6-Deployment/
│   └── deployment-config/
├── 7-Maintenance/
└── SESSION-STATUS.md
```

## Step-by-Step Usage

### Phase 1: Planning
```python
# After completing planning tasks, advance to next phase
artifacts = {
    "project_charter": "1-Planning/project-charter.md",
    "timeline": "1-Planning/initial-timeline.md",
    "stakeholders": "1-Planning/stakeholder-map.md"
}

result = manager.advance_phase(artifacts)
print(f"Now in: {result['phase']}")
print(f"Work in folder: {result['phase_folder']}")
```

### Phase 2: Requirements
```python
# Complete requirements phase
artifacts = {
    "requirements": "2-Requirements/requirements-specification.md",
    "user_stories": "2-Requirements/user-stories.md",
    "acceptance_criteria": "2-Requirements/acceptance-criteria.md"
}

result = manager.advance_phase(artifacts)
```

### Continue Through All Phases
```python
# Phase 3: Design
artifacts = {"architecture": "3-Design/system-architecture.md"}
manager.advance_phase(artifacts)

# Phase 4: Development
artifacts = {"source_code": "4-Development/src/"}
manager.advance_phase(artifacts)

# Phase 5: Testing
artifacts = {"test_plan": "5-Testing/test-plan.md"}
manager.advance_phase(artifacts)

# Phase 6: Deployment
artifacts = {"deployment": "6-Deployment/ci-cd-setup.md"}
manager.advance_phase(artifacts)

# Phase 7: Maintenance
artifacts = {"monitoring": "7-Maintenance/performance-reports.md"}
manager.advance_phase(artifacts)
```

## Integration Examples

### 1. Command Line Script

```python
#!/usr/bin/env python3
import sys
from 1-start-project import ProjectConfig, AISDLCManager

def main():
    if len(sys.argv) < 2:
        print("Usage: python setup_project.py <project_name>")
        return
    
    project_name = sys.argv[1]
    
    config = ProjectConfig(
        name=project_name,
        description=f"{project_name} application",
        tech_stack=["Python", "FastAPI"],
        ai_tools={"assistant": "amazon-q"}
    )
    
    manager = AISDLCManager(config, project_root=f"./{project_name}")
    result = manager.start_project()
    
    print(f"✅ Project '{project_name}' initialized")
    print(f"📁 Start working in: {result['phase_folder']}")
    print(f"📋 Next actions:")
    for action in result['actions']:
        print(f"   - {action}")

if __name__ == "__main__":
    main()
```

**Usage:**
```bash
python start-project.py expense-tracker
```

### 2. IDE Integration

```python
# For VS Code extension or similar
class IDEIntegration:
    def __init__(self):
        self.manager = None
    
    def create_project(self, name, description, tech_stack):
        config = ProjectConfig(name, description, tech_stack, {})
        self.manager = AISDLCManager(config)
        return self.manager.start_project()
    
    def get_current_phase_info(self):
        if not self.manager:
            return None
        
        return {
            "phase": self.manager.PHASES[self.manager.current_phase],
            "folder": self.manager.PHASE_FOLDERS[self.manager.PHASES[self.manager.current_phase]],
            "actions": self.manager._get_actions()
        }
```

### 3. CI/CD Integration

```python
# For automated pipeline triggers
def trigger_phase_completion(phase_name, artifacts_path):
    # Load existing manager state
    manager = load_manager_state()
    
    # Advance phase
    artifacts = {"completed": artifacts_path}
    result = manager.advance_phase(artifacts)
    
    # Trigger next phase automation
    if result['phase'] == 'testing':
        trigger_automated_tests()
    elif result['phase'] == 'deployment':
        trigger_deployment_pipeline()
    
    return result
```

## SESSION-STATUS.md Example

The manager automatically creates and updates this file:

```markdown
# AI-SDLC Session Status

## Current State
- **Phase:** 2. Requirements
- **Progress:** 14% complete
- **Session Date:** 2024-01-15

## Project Info
- **Name:** expense-tracker-app
- **Description:** Personal finance management application
- **Tech Stack:** PHP, Laravel, MariaDB, JavaScript

## Next Actions
- Generate user stories
- Create acceptance criteria
- Define security requirements
```

## Best Practices

### 1. Project Initialization
```python
# Always specify project_root for clean organization
manager = AISDLCManager(config, project_root="./projects/my-app")

# Not recommended (creates folders in current directory)
manager = AISDLCManager(config)
```

### 2. Artifact Tracking
```python
# Good: Track specific files
artifacts = {
    "requirements": "2-Requirements/requirements-specification.md",
    "user_stories": "2-Requirements/user-stories.md"
}

# Avoid: Vague tracking
artifacts = {"done": True}
```

### 3. Error Handling
```python
try:
    result = manager.advance_phase(artifacts)
except Exception as e:
    print(f"Phase advancement failed: {e}")
    # Handle error appropriately
```

## Common Use Cases

### 1. Team Project Setup
```bash
# Team lead initializes project
python -c "
from ai_sdlc_manager import *
config = ProjectConfig('team-project', 'Team application', ['React', 'Node.js'], {})
manager = AISDLCManager(config, './team-project')
manager.start_project()
print('Project ready for team!')
"
```

### 2. Multiple Projects
```python
projects = [
    ("web-app", ["React", "Node.js"]),
    ("mobile-app", ["React Native"]),
    ("api-service", ["Python", "FastAPI"])
]

for name, stack in projects:
    config = ProjectConfig(name, f"{name} application", stack, {})
    manager = AISDLCManager(config, f"./projects/{name}")
    manager.start_project()
```

### 3. Resume Existing Project
```python
# Load existing project (implement state persistence)
def resume_project(project_path):
    # Read SESSION-STATUS.md to determine current phase
    with open(f"{project_path}/SESSION-STATUS.md") as f:
        # Parse current state
        pass
    
    # Recreate manager with current state
    # Continue from where left off
```

## Tips

1. **Always check SESSION-STATUS.md** before resuming work
2. **Use descriptive artifact names** for better tracking
3. **Keep project_root organized** with clear naming
4. **Integrate with version control** for team collaboration
5. **Automate repetitive tasks** using the manager's API