import subprocess
import threading
import os
import time
import sys
import atexit
import webview
import psutil
import inputs  # pip install inputs

# --- CONFIG ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "../backend")
BACKEND_URL = "http://127.0.0.1:8000"

uvicorn_process = None
controller_running = True

# --- BACKEND ---
def start_backend():
    """Start FastAPI backend using uvicorn in a subprocess."""
    global uvicorn_process
    uvicorn_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR
    )

def stop_backend():
    """Kill uvicorn and any child processes."""
    global controller_running
    controller_running = False
    if uvicorn_process:
        try:
            parent = psutil.Process(uvicorn_process.pid)
            for child in parent.children(recursive=True):
                child.terminate()
            parent.terminate()
            psutil.wait_procs([parent]+parent.children(recursive=True))
            print("Backend stopped.")
        except psutil.NoSuchProcess:
            pass

atexit.register(stop_backend)

def wait_for_backend(url=BACKEND_URL, timeout=15):
    """Wait until the backend is ready, or timeout after `timeout` seconds."""
    import requests
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return True
        except requests.ConnectionError:
            pass
        time.sleep(0.5)
    raise RuntimeError(f"Backend did not start within {timeout} seconds.")

# --- CONTROLLER ---
def controller_listener(window):
    """Background thread to listen for controller events and send to webview JS."""
    while controller_running:
        try:
            events = inputs.get_gamepad()
            for event in events:
                js_code = f"""
                if (window.onControllerEvent) {{
                    window.onControllerEvent({{
                        type: "{event.ev_type}",
                        code: "{event.code}",
                        state: {event.state}
                    }});
                }}
                """
                try:
                    window.evaluate_js(js_code)
                except Exception:
                    pass
        except inputs.UnpluggedError:
            time.sleep(1)  # No controller connected

# --- MAIN APP ---
def main():
    global controller_running
    # Start backend in a daemon thread
    threading.Thread(target=start_backend, daemon=True).start()
    
    # Wait until backend is ready
    print("Waiting for backend to start...")
    wait_for_backend()
    print("Backend is ready. Opening webview...")

    # Create webview window
    window = webview.create_window("pytsapp", BACKEND_URL)

    # Start controller listener in background thread
    threading.Thread(target=controller_listener, args=(window,), daemon=True).start()

    # Start webview GUI
    webview.start(gui='cef')  # Force CEF backend for Chromium DevTools

    # Stop controller listener when window closes
    controller_running = False

if __name__ == "__main__":
    main()

