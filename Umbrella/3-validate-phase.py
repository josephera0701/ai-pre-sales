#!/usr/bin/env python3
"""
Validate Phase Completion - Check if current phase is ready to advance
"""

import os
import sys

def validate_phase(project_path=".", phase_number=None):
    """Validate current phase completion"""
    
    # Phase requirements mapping
    phase_requirements = {
        1: ["1-Planning/project-charter.md", "1-Planning/initial-timeline.md", "1-Planning/stakeholder-map.md"],
        2: ["2-Requirements/requirements-specification.md", "2-Requirements/user-stories.md", "2-Requirements/acceptance-criteria.md"],
        3: ["3-Design/system-architecture.md", "3-Design/database-schema.md", "3-Design/api-specifications.md", "3-Design/ui-flows.md", "3-Design/wireframes.md", "3-Design/data-interfaces.md"],
        4: ["4-Development/src/", "4-Development/tests/", "4-Development/docs/"],
        5: ["5-Testing/test-plan.md", "5-Testing/test-cases.md", "5-Testing/test-reports.md"],
        6: ["6-Deployment/ci-cd-setup.md", "6-Deployment/monitoring-setup.md", "6-Deployment/deployment-guide.md"],
        7: ["7-Maintenance/performance-reports.md", "7-Maintenance/user-feedback.md", "7-Maintenance/maintenance-log.md"]
    }
    
    # Get current phase from SESSION-STATUS.md
    status_file = os.path.join(project_path, "SESSION-STATUS.md")
    if not os.path.exists(status_file):
        print("❌ No SESSION-STATUS.md found")
        return False
    
    with open(status_file, 'r') as f:
        content = f.read()
    
    # Extract current phase
    current_phase = phase_number
    if not current_phase:
        phase_lines = [line for line in content.split('\n') if '**Phase:**' in line]
        if phase_lines:
            phase_text = phase_lines[0]
            for i in range(1, 8):
                if f"{i}." in phase_text:
                    current_phase = i
                    break
    
    if not current_phase:
        print("❌ Could not determine current phase")
        return False
    
    print(f"🔍 Validating Phase {current_phase} completion...")
    
    # Check required files/folders
    required_items = phase_requirements.get(current_phase, [])
    missing_items = []
    
    for item in required_items:
        item_path = os.path.join(project_path, item)
        if not os.path.exists(item_path):
            missing_items.append(item)
    
    if missing_items:
        print(f"❌ Phase {current_phase} incomplete. Missing:")
        for item in missing_items:
            print(f"   - {item}")
        print(f"\n💡 Complete these items before advancing to Phase {current_phase + 1}")
        return False
    else:
        print(f"✅ Phase {current_phase} validation passed!")
        print(f"🚀 Ready to advance to Phase {current_phase + 1}")
        return True

def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else "."
    phase_number = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    success = validate_phase(project_path, phase_number)
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()