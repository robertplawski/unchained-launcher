import subprocess
import os
import shutil
from PyInstaller.__main__ import run as pyinstaller_run

def build_frontend():
    """Build the frontend using npm"""
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    
    # Run npm install and build
    print("Installing frontend dependencies...")
    subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
    
    print("Building frontend...")
    subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
    
    print("Frontend build completed!")

def build_executable():
    """Build the executable using PyInstaller with spec file"""
    print("Building executable with PyInstaller...")
    pyinstaller_run(['desktop.spec'])
    print("Executable build completed!")

def main():
    build_frontend()
    build_executable()

if __name__ == "__main__":
    main()
