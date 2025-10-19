#!/usr/bin/env python3
"""
AI-SDLC Project Initialization - Interactive setup for AI-driven development
"""

import json
import os
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Dict
from datetime import datetime

@dataclass
class ProjectConfig:
    name: str
    description: str
    tech_stack: List[str]
    ai_tools: Dict[str, str]

class AISDLCManager:
    PHASES = [
        "planning", "requirements", "design", 
        "development", "testing", "deployment", "maintenance"
    ]
    
    PHASE_FOLDERS = {
        "planning": "1-Planning",
        "requirements": "2-Requirements", 
        "design": "3-Design",
        "development": "4-Development",
        "testing": "5-Testing",
        "deployment": "6-Deployment",
        "maintenance": "7-Maintenance"
    }
    
    def __init__(self, config: ProjectConfig, project_root: str = "."):
        self.config = config
        self.project_root = project_root
        self.current_phase = 0
        self.artifacts = {}
        self._ensure_folder_structure()
    
    def _ensure_folder_structure(self):
        """Create required folder structure"""
        for folder in self.PHASE_FOLDERS.values():
            os.makedirs(os.path.join(self.project_root, folder), exist_ok=True)
        
        # Create subfolders for iterative phases
        os.makedirs(os.path.join(self.project_root, "3-Design/architecture-diagrams"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "3-Design/ui-flows"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "3-Design/wireframes"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "3-Design/data-interfaces"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "4-Development/components"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "4-Development/shared"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "4-Development/integration"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "5-Testing/component-tests"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "5-Testing/integration-tests"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "6-Deployment/deployed-components"), exist_ok=True)
        os.makedirs(os.path.join(self.project_root, "6-Deployment/monitoring"), exist_ok=True)
    
    def start_project(self) -> Dict:
        """Initialize AI-driven project"""
        self._create_session_status()
        git_status = self._init_git_repo()
        ai_rules_status = self._setup_ai_rules()
        return {
            "project": self.config.name,
            "phase": self.PHASES[self.current_phase],
            "phase_folder": self.PHASE_FOLDERS[self.PHASES[self.current_phase]],
            "actions": self._get_actions(),
            "folder_structure_created": True,
            "git_initialized": git_status,
            "ai_rules_loaded": ai_rules_status
        }
    
    def advance_phase(self, artifacts: Dict) -> Dict:
        """Move to next phase"""
        current_phase_name = self.PHASES[self.current_phase]
        self.artifacts[current_phase_name] = artifacts
        
        if self.current_phase < len(self.PHASES) - 1:
            self.current_phase += 1
        
        self._update_session_status()
        
        return {
            "phase": self.PHASES[self.current_phase],
            "phase_folder": self.PHASE_FOLDERS[self.PHASES[self.current_phase]],
            "actions": self._get_actions(),
            "artifacts_stored": len(artifacts)
        }
    
    def _get_actions(self) -> List[str]:
        """Get phase-specific AI actions"""
        actions_map = {
            "planning": ["Create project charter", "Define timeline", "Map stakeholders"],
            "requirements": ["Generate user stories", "Create acceptance criteria", "Define security requirements"],
            "design": ["Create architecture", "Design API specs", "Plan database schema"],
            "development": ["Generate code", "Implement features", "Create unit tests"],
            "testing": ["Create test plan", "Generate test cases", "Run automated tests"],
            "deployment": ["Configure CI/CD", "Deploy application", "Setup monitoring"],
            "maintenance": ["Monitor performance", "Analyze feedback", "Plan enhancements"]
        }
        return actions_map.get(self.PHASES[self.current_phase], [])
    
    def _create_session_status(self):
        """Create initial session status file"""
        status = {
            "current_state": {
                "phase": f"{self.current_phase + 1}. {self.PHASES[self.current_phase].title()}",
                "progress": "0% complete",
                "last_task": "Project initialization",
                "session_date": datetime.now().strftime("%Y-%m-%d")
            },
            "project_info": {
                "name": self.config.name,
                "description": self.config.description,
                "tech_stack": self.config.tech_stack,
                "ai_tools": self.config.ai_tools
            },
            "next_actions": self._get_actions()
        }
        
        with open(os.path.join(self.project_root, "SESSION-STATUS.md"), "w") as f:
            f.write("# AI-SDLC Session Status\n\n")
            f.write(f"## Current State\n")
            f.write(f"- **Phase:** {status['current_state']['phase']}\n")
            f.write(f"- **Progress:** {status['current_state']['progress']}\n")
            f.write(f"- **Last Task:** {status['current_state']['last_task']}\n")
            f.write(f"- **Session Date:** {status['current_state']['session_date']}\n\n")
            f.write(f"## Project Info\n")
            f.write(f"- **Name:** {status['project_info']['name']}\n")
            f.write(f"- **Description:** {status['project_info']['description']}\n")
            f.write(f"- **Tech Stack:** {', '.join(status['project_info']['tech_stack'])}\n\n")
            f.write(f"## Next Actions\n")
            for action in status['next_actions']:
                f.write(f"- {action}\n")
    
    def _update_session_status(self):
        """Update session status file"""
        progress = f"{int((self.current_phase / len(self.PHASES)) * 100)}% complete"
        
        with open(os.path.join(self.project_root, "SESSION-STATUS.md"), "w") as f:
            f.write("# AI-SDLC Session Status\n\n")
            f.write(f"## Current State\n")
            f.write(f"- **Phase:** {self.current_phase + 1}. {self.PHASES[self.current_phase].title()}\n")
            f.write(f"- **Progress:** {progress}\n")
            f.write(f"- **Session Date:** {datetime.now().strftime('%Y-%m-%d')}\n\n")
            f.write(f"## Next Actions\n")
            for action in self._get_actions():
                f.write(f"- {action}\n")
    
    def _init_git_repo(self) -> str:
        """Initialize Git repository"""
        try:
            subprocess.run(["git", "--version"], check=True, capture_output=True)
            if os.path.exists(os.path.join(self.project_root, ".git")):
                return "Git repository already exists"
            subprocess.run(["git", "init"], cwd=self.project_root, check=True, capture_output=True)
            gitignore_content = "# AI-SDLC Project\n*.log\n*.tmp\n.DS_Store\nThumbs.db\n"
            with open(os.path.join(self.project_root, ".gitignore"), "w") as f:
                f.write(gitignore_content)
            subprocess.run(["git", "add", "."], cwd=self.project_root, check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", "Initial AI-SDLC project setup"], cwd=self.project_root, check=True, capture_output=True)
            return "Git repository initialized successfully"
        except (subprocess.CalledProcessError, FileNotFoundError):
            return "Git not found - please install Git first"
    
    def _setup_ai_rules(self) -> str:
        """Copy AI rules to .amazonq folder for Amazon Q access"""
        try:
            # Create .amazonq/rules folder
            amazonq_rules_dir = os.path.join(self.project_root, ".amazonq", "rules")
            os.makedirs(amazonq_rules_dir, exist_ok=True)
            
            # Get the directory where this script is located (Umbrella folder)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # List of rule files to copy
            rule_files = [
                "phase1-planning-rules.md",
                "phase2-requirements-rules.md", 
                "phase3-design-rules.md",
                "phase4-development-rules.md",
                "phase5-testing-rules.md",
                "phase6-deployment-rules.md",
                "phase7-maintenance-rules.md",
                "context-management-rules.md",
                "file-organization-rules.md",
                "iterative-development-rules.md"
            ]
            
            copied_files = 0
            for rule_file in rule_files:
                source_path = os.path.join(script_dir, rule_file)
                dest_path = os.path.join(amazonq_rules_dir, rule_file)
                
                if os.path.exists(source_path):
                    with open(source_path, 'r') as src, open(dest_path, 'w') as dst:
                        dst.write(src.read())
                    copied_files += 1
            
            return f"AI rules loaded: {copied_files}/{len(rule_files)} files copied to .amazonq/rules/"
        except Exception as e:
            return f"AI rules setup failed: {str(e)}"

def get_project_config() -> ProjectConfig:
    """Interactive project configuration"""
    print("🚀 AI-SDLC Project Initialization")
    print("=" * 40)
    
    # Project name
    while True:
        name = input("\n📝 Project name: ").strip()
        if name and name.replace('-', '').replace('_', '').isalnum():
            break
        print("❌ Please enter a valid project name (alphanumeric, hyphens, underscores only)")
    
    # Project description
    description = input("📄 Project description: ").strip()
    if not description:
        description = f"{name} application"
    
    # Tech stack
    print("\n🛠️  Technology Stack (press Enter when done):")
    print("Examples: Python, JavaScript, React, Node.js, PostgreSQL, Docker")
    tech_stack = []
    while True:
        tech = input(f"Tech {len(tech_stack) + 1} (or Enter to finish): ").strip()
        if not tech:
            break
        tech_stack.append(tech)
    
    if not tech_stack:
        tech_stack = ["Python"]  # Default
        print(f"Using default tech stack: {tech_stack}")
    
    # AI tools preference
    print("\n🤖 AI Tools Configuration:")
    ai_assistant = input("Primary AI assistant (default: amazon-q): ").strip() or "amazon-q"
    code_review = input("Code review tool (default: automated): ").strip() or "automated"
    
    ai_tools = {
        "assistant": ai_assistant,
        "code_review": code_review
    }
    
    return ProjectConfig(name, description, tech_stack, ai_tools)

def main():
    """Main execution function"""
    try:
        # Get project configuration interactively
        config = get_project_config()
        
        # Determine project root
        project_root = f"./{config.name}"
        if os.path.exists(project_root):
            overwrite = input(f"\n⚠️  Directory '{config.name}' exists. Overwrite? (y/N): ").strip().lower()
            if overwrite != 'y':
                print("❌ Project initialization cancelled")
                return
        
        # Initialize project
        print(f"\n🏗️  Initializing project '{config.name}'...")
        manager = AISDLCManager(config, project_root)
        result = manager.start_project()
        
        # Display results
        print("\n✅ Project initialized successfully!")
        print(f"📁 Project folder: {project_root}")
        print(f"📋 Current phase: {result['phase'].title()}")
        print(f"🔧 Git status: {result['git_initialized']}")
        print(f"🤖 AI rules: {result['ai_rules_loaded']}")
        
        print(f"\n🎯 Next steps:")
        print(f"1. cd {config.name}")
        print(f"2. Work in folder: {result['phase_folder']}")
        print(f"3. Complete these actions:")
        for action in result['actions']:
            print(f"   - {action}")
        print(f"4. Run: python ../Umbrella/3-validate-phase.py")
        
    except KeyboardInterrupt:
        print("\n❌ Project initialization cancelled")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()