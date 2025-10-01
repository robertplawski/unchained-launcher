import time
import os
import webview
import random
import uvicorn
import threading
from backend.main import app
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CONFIG ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_port_from_env(env_name: str = "PORT", default: int = 8000) -> int:
    """Read port from environment, validate, and return an int port.
    Falls back to default on missing/invalid values.
    """
    val = os.getenv(env_name)
    if not val:
        return default
    try:
        port = int(val)
        if 1 <= port <= 65535:
            return port
        else:
            logger.warning("Port %s out of range, using default %s", val, default)
    except ValueError:
        logger.warning("Invalid port value %r, using default %s", val, default)
    return default

PORT = get_port_from_env("PORT", 8000)
BACKEND_URL = f"http://localhost:{PORT}?nocache={random.randint(0,100000)}"

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000)

def main():
    # Start the FastAPI server in a separate thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give the server a moment to start
    import time
    time.sleep(3)

    # WebKit settings
    os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "0"
    os.environ["WEBKIT_USE_ACCELERATED_COMPOSITING"] = "1"

    # QT / QtWebEngine (if using qt backend)
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--enable-gpu-rasterization --ignore-gpu-blacklist"

    # Create webview window
    window = webview.create_window("Unchained Launcher", BACKEND_URL)

    # Start webview GUI
    webview.start(debug=False)  # Set debug to False for production


if __name__ == "__main__":
    main()

