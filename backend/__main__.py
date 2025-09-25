"""
Entry point for running the backend application.
Allows the package to be executed with `python -m backend`.
"""
import sys
import os

def main():
    """Main entry point for the application."""
    try:
        from .main import app
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=8000)
    except ImportError as e:
        print(f"Error importing from main.py: {e}")
        print("Make sure your main.py contains a FastAPI app instance named 'app'")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting the application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
