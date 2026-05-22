from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

PhotoKind = Literal["image", "raw-preview"]
JobStatus = Literal["queued", "running", "done", "failed"]


@dataclass(frozen=True)
class Project:
    id: str
    name: str
    source_path: Path
    created_at: str


@dataclass(frozen=True)
class Photo:
    id: str
    project_id: str
    path: Path
    filename: str
    extension: str
    kind: PhotoKind
    size_bytes: int
    modified_at: float
    width: int | None = None
    height: int | None = None


@dataclass
class Job:
    id: str
    kind: str
    status: JobStatus = "queued"
    progress: float = 0.0
    error: str | None = None
    result: dict = field(default_factory=dict)
