import subprocess
import os
import shutil
from PyInstaller.__main__ import run as pyinstaller_run

def is_executable_on_path(name):
    """Return True if an executable exists on PATH (cross-platform)."""
    for path in os.environ.get("PATH", "").split(os.pathsep):
        full = os.path.join(path, name)
        if os.path.isfile(full) and os.access(full, os.X_OK):
            return True
    return False

def find_npm_command():
    """Return the npm executable name available on PATH for the current platform."""
    if os.name == "nt":
        candidates = ["npm.cmd", "npm.exe", "npm"]
    else:
        candidates = ["npm"]
    for c in candidates:
        if is_executable_on_path(c):
            return c
    return None

def build_frontend():
    """Build the frontend using npm"""
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    npm_cmd = find_npm_command()
    if not npm_cmd:
        raise FileNotFoundError("npm executable not found on PATH. Install Node.js / npm or adjust PATH.")
    # Run npm install and build
    print("Installing frontend dependencies...")
    subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
    print("Building frontend...")
    subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
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

