#!/usr/bin/env python3
"""
Pause AI-SDLC Project - Save current work and commit to Git
"""

import os
import sys
import subprocess
from datetime import datetime

def pause_project(project_path=".", commit_message=None):
    """Pause project and commit changes to Git"""
    
    # Check if SESSION-STATUS.md exists
    status_file = os.path.join(project_path, "SESSION-STATUS.md")
    if not os.path.exists(status_file):
        print("❌ No SESSION-STATUS.md found. Not an AI-SDLC project.")
        return False
    
    # Check if Git repository exists
    if not os.path.exists(os.path.join(project_path, ".git")):
        print("❌ No Git repository found. Run 1-start-project.py first.")
        return False
    
    try:
        # Check Git status
        result = subprocess.run(["git", "status", "--porcelain"], 
                              cwd=project_path, capture_output=True, text=True, check=True)
        
        if not result.stdout.strip():
            print("✅ No changes to commit. Project already up to date.")
            return True
        
        # Show what will be committed
        print("📋 Changes to be committed:")
        subprocess.run(["git", "status", "--short"], cwd=project_path, check=True)
        
        # Add all changes
        subprocess.run(["git", "add", "."], cwd=project_path, check=True)
        
        # Create commit message
        if not commit_message:
            # Read current phase from SESSION-STATUS.md
            with open(status_file, 'r') as f:
                content = f.read()
            
            phase_line = [line for line in content.split('\n') if '**Phase:**' in line]
            current_phase = "Unknown Phase"
            if phase_line:
                current_phase = phase_line[0].split('**Phase:**')[1].strip()
            
            commit_message = f"Pause work: {current_phase} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Commit changes
        subprocess.run(["git", "commit", "-m", commit_message], 
                      cwd=project_path, check=True)
        
        print(f"✅ Changes committed locally: {commit_message}")
        
        # Try to push to remote (if configured)
        try:
            # Check if remote exists
            result = subprocess.run(["git", "remote", "-v"], 
                                  cwd=project_path, capture_output=True, text=True, check=True)
            
            if result.stdout.strip():
                # Remote exists, try to push
                subprocess.run(["git", "push"], cwd=project_path, check=True)
                print("🚀 Changes pushed to remote repository")
            else:
                print("📡 No remote repository configured")
                print("   To add remote: git remote add origin <repository-url>")
                print("   Then push: git push -u origin main")
        
        except subprocess.CalledProcessError:
            print("⚠️  Could not push to remote (network issue or not configured)")
            print("   Changes are saved locally. Push manually when ready:")
            print("   git push")
        
        # Update SESSION-STATUS.md with pause info
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        with open(status_file, 'a') as f:
            f.write(f"\n## Session Paused\n")
            f.write(f"- **Paused At:** {timestamp}\n")
            f.write(f"- **Last Commit:** {commit_message}\n")
        
        print(f"\n⏸️  Project paused successfully at {timestamp}")
        print("📝 SESSION-STATUS.md updated with pause information")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Git operation failed: {e}")
        return False
    except FileNotFoundError:
        print("❌ Git not found. Please install Git first.")
        print("   Install from: https://git-scm.com/downloads")
        return False

def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else "."
    commit_message = sys.argv[2] if len(sys.argv) > 2 else None
    
    print("⏸️  Pausing AI-SDLC Project...")
    success = pause_project(project_path, commit_message)
    
    if success:
        print("\n✅ Project paused successfully!")
        print("💡 To resume: python ../Umbrella/2-resume-project.py")
    else:
        print("\n❌ Failed to pause project")
        sys.exit(1)

if __name__ == "__main__":
    main()