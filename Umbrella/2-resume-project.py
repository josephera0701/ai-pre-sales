#!/usr/bin/env python3
"""
Resume AI-SDLC Project - Simple script to check status and get next steps
"""

import os
import sys

def resume_project(project_path="."):
    """Resume existing AI-SDLC project"""
    
    # Check if SESSION-STATUS.md exists
    status_file = os.path.join(project_path, "SESSION-STATUS.md")
    if not os.path.exists(status_file):
        print("❌ No SESSION-STATUS.md found. Run 1-start-project.py first to setup project.")
        return
    
    # Read current status
    with open(status_file, 'r') as f:
        content = f.read()
    
    print("📋 Current Project Status:")
    print("=" * 50)
    print(content)
    print("=" * 50)
    
    # Extract current phase from content
    phase_line = [line for line in content.split('\n') if '**Phase:**' in line]
    if phase_line:
        phase_text = phase_line[0]
        if "1. Planning" in phase_text:
            rules_file = "phase1-planning-rules.md"
        elif "2. Requirements" in phase_text:
            rules_file = "phase2-requirements-rules.md"
        elif "3. Design" in phase_text:
            rules_file = "phase3-design-rules.md"
        elif "4. Development" in phase_text:
            rules_file = "phase4-development-rules.md"
        elif "5. Testing" in phase_text:
            rules_file = "phase5-testing-rules.md"
        elif "6. Deployment" in phase_text:
            rules_file = "phase6-deployment-rules.md"
        elif "7. Maintenance" in phase_text:
            rules_file = "phase7-maintenance-rules.md"
        else:
            rules_file = "phase1-planning-rules.md"
        
        print(f"\n🤖 AI rules already loaded in .amazonq/rules/{rules_file}")
        print(f"📁 Work in the current phase folder shown above")
        print(f"📝 Update SESSION-STATUS.md when you complete tasks")
        print(f"🔍 Validate progress: python ../Umbrella/3-validate-phase.py")
    
    print(f"\n💡 To update status manually, edit: {status_file}")

if __name__ == "__main__":
    project_path = sys.argv[1] if len(sys.argv) > 1 else "."
    resume_project(project_path)