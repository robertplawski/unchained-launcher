import os
import webview
import random
import uvicorn
import threading
from backend.main import app

# --- CONFIG ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_URL = f"http://127.0.0.1:8000?nocache={random.randint(0,100000)}"

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000)

def main():
    # Start the FastAPI server in a separate thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give the server a moment to start
    import time
    time.sleep(1)

    # WebKit settings
    os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "0"
    os.environ["WEBKIT_USE_ACCELERATED_COMPOSITING"] = "1"

    # QT / QtWebEngine (if using qt backend)
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--enable-gpu-rasterization --ignore-gpu-blacklist"

    # Create webview window
    window = webview.create_window("Unchained Launcher", BACKEND_URL, frameless=True)

    # Start webview GUI
    webview.start(debug=False)  # Set debug to False for production


if __name__ == "__main__":
    main()
