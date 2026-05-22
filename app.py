"""Compatibility launcher for the Sift Python sidecar.

The production desktop UI is now the Vite/React/Tauri app in `src/` and
`src-tauri/`. The old Flask prototype remains under `templates/` and `static/`
only as a visual reference while the UI is migrated.
"""

from backend.siftd.main import main


if __name__ == "__main__":
    main()
