export interface JobStatus {
  id: string;
  groupId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface EtlEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export interface JobRunRequest {
  groupId: string;
  parameters?: Record<string, any>;
  priority?: "low" | "normal" | "high";
}

export interface StreamingJobUpdate {
  jobId: string;
  status: JobStatus;
  timestamp: string;
  eventType: "status_change" | "progress_update" | "log_entry";
}

// Central enum for allowed assistant tones
export enum Tone {
  Professional = "professional",
  Casual = "casual",
  Friendly = "friendly",
}
