"""
TCRE Device Studio Application Entry Point.
Runs the main CustomTkinter GUI dashboard.
"""

import sys
import os

# Ensure the project root directory is in sys.path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from gui.main_window import MainWindow


def main() -> None:
    """
    Initializes and launches the TCRE Device Studio application.
    """
    try:
        app = MainWindow()
        
        # Start Device Bridge background service
        from core.device_bridge import DeviceBridge
        bridge = DeviceBridge(app.device_manager)
        bridge.start()
        
        app.mainloop()
        
        # Clean shutdown of background thread when app window is closed
        bridge.stop()
    except Exception as e:
        print(f"Fatal error starting TCRE Device Studio: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
