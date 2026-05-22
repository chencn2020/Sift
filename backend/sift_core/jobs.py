from __future__ import annotations

import threading
from collections.abc import Callable
from uuid import uuid4

from .models import Job


class InMemoryJobQueue:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def submit(self, kind: str, task: Callable[[Job], dict]) -> Job:
        job = Job(id=uuid4().hex, kind=kind)
        with self._lock:
            self._jobs[job.id] = job

        def runner() -> None:
            job.status = "running"
            try:
                job.result = task(job)
                job.progress = 1.0
                job.status = "done"
            except Exception as error:  # pragma: no cover - defensive worker boundary
                job.status = "failed"
                job.error = str(error)

        threading.Thread(target=runner, daemon=True).start()
        return job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)
