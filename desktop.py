import sys
import platform
import time
import os
import webview
import random
import uvicorn
import threading
from backend.main import app
import logging
import pystray
from PIL import Image  

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CONFIG ---
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VERSION = "0.0.11"  

def create_tray_icon():
    """Create and run the system tray icon."""
    # Try to load a custom icon; fallback to a blank image if not found
    icon_path = os.path.join(ROOT_DIR, "icon.png")
    if os.path.exists(icon_path):
        image = Image.open(icon_path)
    else:
        # Create a minimal blank icon (16x16 white)
        image = Image.new('RGB', (16, 16), color='blue')

    def show_window(icon, item):
        global window
        if window:
            window.show()

    def hide_window(icon, item):
        global window
        if window:
            window.hide()

    def quit_app(icon, item):
        icon.stop()
        global window
        if window:
            window.destroy()
        os._exit(0)  # Force exit after cleanup

    menu = pystray.Menu(
        pystray.MenuItem("Show", show_window),
        pystray.MenuItem("Hide", hide_window),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", quit_app)
    )

    icon = pystray.Icon("Unchained Launcher", image, "Unchained Launcher", menu)
    icon.run()

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
    global window
    # Check for --version argument
    if "--version" in sys.argv:
        print(f"Unchained Launcher version {VERSION}")
        sys.exit(0)


    window = webview.create_window("Unchained Launcher", BACKEND_URL)

    # Start system tray in a separate thread
    tray_thread = threading.Thread(target=create_tray_icon, daemon=True)
    tray_thread.start()

    # Start the FastAPI server in a separate thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    

    # WebKit settings
    os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "0"
    os.environ["WEBKIT_USE_ACCELERATED_COMPOSITING"] = "1"

    # QT / QtWebEngine (if using qt backend)
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--enable-gpu-rasterization --ignore-gpu-blacklist"

    # Create webview window

    gui_backend = "cef"   # CEF on Linux/macOS
    
    if platform.system() == "Windows":
        gui_backend = "edgechromium"  

    debug = False
    if os.getenv("DEBUG") == "1": 
        debug = True

    # Start webview GUI
    webview.start(gui=gui_backend,debug=debug)  # Set debug to False for production

if __name__ == "__main__":
    main()

