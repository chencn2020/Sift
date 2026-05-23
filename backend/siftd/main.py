from __future__ import annotations

import argparse
import os
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from backend.sift_core.ai import provider_from_settings
from backend.sift_core.importer import scan_folder
from backend.sift_core.jobs import InMemoryJobQueue
from backend.sift_core.storage import SiftStore


class ImportFolderPayload(BaseModel):
    folderPath: str
    projectName: str | None = None


class AnalyzePayload(BaseModel):
    projectId: str
    photoIds: list[str]
    options: dict = Field(default_factory=dict)


class ExportPayload(BaseModel):
    projectId: str
    photoIds: list[str]
    options: dict = Field(default_factory=dict)


def create_app(db_path: Path, token: str, allow_cloud_ai: bool = False) -> FastAPI:
    app = FastAPI(title="Sift local sidecar", version="0.1.0-alpha.2")
    store = SiftStore(db_path)
    store.initialize()
    queue = InMemoryJobQueue()

    def require_auth(authorization: str = Header(default="")) -> None:
        expected = f"Bearer {token}"
        if authorization != expected:
            raise HTTPException(status_code=401, detail="invalid sidecar token")

    @app.get("/health", dependencies=[Depends(require_auth)])
    def health() -> dict:
        return {"status": "ok", "version": app.version, "cloudAiEnabled": allow_cloud_ai}

    @app.get("/projects", dependencies=[Depends(require_auth)])
    def list_projects() -> list[dict]:
        return store.list_projects()

    @app.post("/projects/import", dependencies=[Depends(require_auth)])
    def import_folder(payload: ImportFolderPayload) -> dict:
        def task(job):
            source = Path(payload.folderPath)
            project = store.create_project(payload.projectName or source.name, source)
            photos = scan_folder(project.id, source)
            job.progress = 0.6
            count = store.upsert_photos(photos)
            return {"projectId": project.id, "photoCount": count}

        job = queue.submit("import-folder", task)
        return {"jobId": job.id, "status": job.status}

    @app.post("/ai/analyze", dependencies=[Depends(require_auth)])
    def analyze(payload: AnalyzePayload) -> dict:
        def task(job):
            provider = provider_from_settings(allow_cloud=allow_cloud_ai, provider_name=payload.options.get("provider"))
            result = provider.analyze(payload.projectId, payload.photoIds, payload.options)
            job.progress = 0.95
            return {
                "scores": result.scores,
                "faces": result.faces,
                "duplicateGroups": result.duplicate_groups,
                "burstGroups": result.burst_groups,
            }

        job = queue.submit("ai-analyze", task)
        return {"jobId": job.id, "status": job.status}

    @app.post("/exports", dependencies=[Depends(require_auth)])
    def export_selection(payload: ExportPayload) -> dict:
        def task(job):
            job.progress = 1.0
            return {"projectId": payload.projectId, "photoCount": len(payload.photoIds), "options": payload.options}

        job = queue.submit("export", task)
        return {"jobId": job.id, "status": job.status}

    @app.get("/jobs/{job_id}", dependencies=[Depends(require_auth)])
    def get_job(job_id: str) -> dict:
        job = queue.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="job not found")
        return {
            "jobId": job.id,
            "kind": job.kind,
            "status": job.status,
            "progress": job.progress,
            "error": job.error,
            "result": job.result,
        }

    return app


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Sift local sidecar service.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--db", default=os.environ.get("SIFT_DB", str(Path.home() / ".sift" / "sift.sqlite3")))
    parser.add_argument("--dev-token", default=os.environ.get("SIFT_TOKEN", "dev-token"))
    parser.add_argument("--allow-cloud-ai", action="store_true")
    args = parser.parse_args()

    import uvicorn

    app = create_app(Path(args.db), token=args.dev_token, allow_cloud_ai=args.allow_cloud_ai)
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
