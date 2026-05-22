import type { ExportOptions } from "./types";

export interface HealthResponse {
  status: "ok";
  version: string;
  cloudAiEnabled: boolean;
}

export interface ImportFolderRequest {
  folderPath: string;
  projectName?: string;
}

export interface JobResponse {
  jobId: string;
  status: "queued" | "running" | "done" | "failed";
}

export class SiftApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl = import.meta.env.VITE_SIFTD_URL ?? "", token = import.meta.env.VITE_SIFTD_TOKEN ?? "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  async importFolder(payload: ImportFolderRequest): Promise<JobResponse> {
    return this.request<JobResponse>("/projects/import", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async analyze(projectId: string, photoIds: number[], options: Record<string, unknown>): Promise<JobResponse> {
    return this.request<JobResponse>("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ projectId, photoIds, options })
    });
  }

  async exportSelection(projectId: string, photoIds: number[], options: ExportOptions): Promise<JobResponse> {
    return this.request<JobResponse>("/exports", {
      method: "POST",
      body: JSON.stringify({ projectId, photoIds, options })
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new Error("siftd base URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
        ...init.headers
      }
    });

    if (!response.ok) {
      throw new Error(`siftd request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

export const siftApi = new SiftApiClient();
