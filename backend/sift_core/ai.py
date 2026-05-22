from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AnalyzeResult:
    scores: dict[str, dict]
    faces: list[dict]
    duplicate_groups: list[list[str]]
    burst_groups: list[list[str]]


class AiProvider:
    name = "base"

    def analyze(self, project_id: str, photo_ids: list[str], options: dict) -> AnalyzeResult:
        raise NotImplementedError


class LocalHeuristicProvider(AiProvider):
    name = "local-heuristic"

    def analyze(self, project_id: str, photo_ids: list[str], options: dict) -> AnalyzeResult:
        scores = {}
        for index, photo_id in enumerate(photo_ids):
            sharpness = 0.5 + ((index * 17) % 50) / 100
            scores[photo_id] = {
                "sharpness": round(sharpness, 3),
                "exposure": round(0.62 + ((index * 11) % 32) / 100, 3),
                "noise": round(0.58 + ((index * 7) % 35) / 100, 3),
                "eyes_open": 0.2 if index % 13 == 0 else 0.92,
                "provider": self.name,
            }
        return AnalyzeResult(scores=scores, faces=[], duplicate_groups=[], burst_groups=[])


def provider_from_settings(allow_cloud: bool, provider_name: str | None = None) -> AiProvider:
    if provider_name and provider_name != "local" and not allow_cloud:
        raise PermissionError("Cloud AI providers require explicit opt-in")
    return LocalHeuristicProvider()
