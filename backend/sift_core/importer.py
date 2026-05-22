from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from .constants import SUPPORTED_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS
from .models import Photo


def scan_folder(project_id: str, folder: Path) -> list[Photo]:
    """Return supported photos without mutating source files."""

    folder = folder.expanduser().resolve()
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Folder does not exist: {folder}")

    photos: list[Photo] = []
    for path in sorted(folder.rglob("*")):
        if not path.is_file():
            continue
        extension = path.suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            continue
        stat = path.stat()
        width, height = image_dimensions(path) if extension in SUPPORTED_IMAGE_EXTENSIONS else (None, None)
        photos.append(
            Photo(
                id=uuid4().hex,
                project_id=project_id,
                path=path,
                filename=path.name,
                extension=extension,
                kind="image" if extension in SUPPORTED_IMAGE_EXTENSIONS else "raw-preview",
                size_bytes=stat.st_size,
                modified_at=stat.st_mtime,
                width=width,
                height=height,
            )
        )
    return photos


def image_dimensions(path: Path) -> tuple[int | None, int | None]:
    try:
        from PIL import Image

        with Image.open(path) as image:
            return image.size
    except Exception:
        return None, None
