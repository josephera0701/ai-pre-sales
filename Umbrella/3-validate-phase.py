#!/usr/bin/env python3
"""
Validate Phase Completion - Check if current phase is ready to advance
"""

import os
import sys

def validate_phase(project_path=".", phase_number=None):
    """Validate current phase completion with iterative support"""
    
    # Phase requirements mapping
    phase_requirements = {
        1: ["1-Planning/project-charter.md", "1-Planning/initial-timeline.md", "1-Planning/stakeholder-map.md"],
        2: ["2-Requirements/requirements-specification.md", "2-Requirements/user-stories.md", "2-Requirements/acceptance-criteria.md"],
        3: ["3-Design/system-architecture.md", "3-Design/database-schema.md", "3-Design/api-specifications.md", "3-Design/ui-flows.md", "3-Design/wireframes.md", "3-Design/data-interfaces.md"],
        4: ["4-Development/components/", "4-Development/component-breakdown.md"],
        5: ["5-Testing/component-tests/", "5-Testing/test-status.md"],
        6: ["6-Deployment/deployed-components/", "6-Deployment/deployment-status.md"],
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
    
    # Special handling for iterative phases 4-6
    if current_phase >= 4 and current_phase <= 6:
        return validate_iterative_phase(project_path, current_phase)
    
    # Check required files/folders for linear phases
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

def validate_iterative_phase(project_path, phase_number):
    """Validate iterative phases 4-6 with component tracking"""
    component_status = get_component_status(project_path)
    
    if phase_number == 4:  # Development
        return validate_development_components(component_status)
    elif phase_number == 5:  # Testing
        return validate_testing_components(component_status)
    elif phase_number == 6:  # Deployment
        return validate_deployment_components(component_status)

def get_component_status(project_path):
    """Get current status of all components across phases 4-6"""
    status = {"development": [], "testing": [], "deployed": []}
    
    # Check development components
    dev_path = os.path.join(project_path, "4-Development/components")
    if os.path.exists(dev_path):
        status["development"] = [d for d in os.listdir(dev_path) if os.path.isdir(os.path.join(dev_path, d))]
    
    # Check testing components
    test_path = os.path.join(project_path, "5-Testing/component-tests")
    if os.path.exists(test_path):
        status["testing"] = [d for d in os.listdir(test_path) if os.path.isdir(os.path.join(test_path, d))]
    
    # Check deployed components
    deploy_path = os.path.join(project_path, "6-Deployment/deployed-components")
    if os.path.exists(deploy_path):
        status["deployed"] = [d for d in os.listdir(deploy_path) if os.path.isdir(os.path.join(deploy_path, d))]
    
    return status

def validate_development_components(component_status):
    """Validate development phase components"""
    components = component_status["development"]
    ready_for_testing = []
    in_development = []
    
    for component in components:
        # Check if component has required structure
        component_path = os.path.join("4-Development/components", component)
        has_src = os.path.exists(os.path.join(component_path, "src"))
        has_tests = os.path.exists(os.path.join(component_path, "tests"))
        has_docs = os.path.exists(os.path.join(component_path, "docs"))
        
        if has_src and has_tests and has_docs:
            ready_for_testing.append(component)
        else:
            in_development.append(component)
    
    print(f"🔄 Phase 4: Development (Iterative)")
    print(f"📦 Components ready for testing: {len(ready_for_testing)}")
    print(f"🚧 Components in development: {len(in_development)}")
    
    if ready_for_testing:
        print(f"✅ Ready components: {', '.join(ready_for_testing)}")
        print(f"🚀 Move these to Phase 5 (Testing)")
    
    return len(ready_for_testing) > 0

def validate_testing_components(component_status):
    """Validate testing phase components"""
    testing_components = component_status["testing"]
    ready_for_deployment = []
    
    for component in testing_components:
        test_path = os.path.join("5-Testing/component-tests", component)
        if os.path.exists(test_path):
            ready_for_deployment.append(component)
    
    print(f"🧪 Phase 5: Testing (Iterative)")
    print(f"✅ Components ready for deployment: {len(ready_for_deployment)}")
    print(f"🔬 Components in testing: {len(testing_components) - len(ready_for_deployment)}")
    
    if ready_for_deployment:
        print(f"🚀 Ready for deployment: {', '.join(ready_for_deployment)}")
    
    return len(ready_for_deployment) > 0

def validate_deployment_components(component_status):
    """Validate deployment phase components"""
    deployed_components = component_status["deployed"]
    total_components = len(component_status["development"]) + len(component_status["testing"]) + len(deployed_components)
    
    print(f"🚀 Phase 6: Deployment (Iterative)")
    print(f"✅ Deployed components: {len(deployed_components)}")
    print(f"📊 Total components: {total_components}")
    
    if deployed_components:
        print(f"🎉 Live components: {', '.join(deployed_components)}")
    
    return len(deployed_components) > 0

def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else "."
    phase_number = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    success = validate_phase(project_path, phase_number)
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()