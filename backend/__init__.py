"""
Backend package for the game launcher application.
"""
__version__ = "0.1.0"

# Import the main FastAPI app
try:
    from .main import app
    __all__ = ["app"]
except ImportError:
    # If app is not available, keep the package minimal
    pass
