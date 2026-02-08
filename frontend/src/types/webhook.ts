export interface WebhookMessage {
  id: string;
  timestamp: string;
  path: string | null;
  sourceIp: string | null;
  headers: Record<string, string[]>;
  rawBody: string | null;
  contentLength: number;
  preview: string | null;
  level: string | null;
}

export interface MessageFilter {
  pathContains?: string;
  searchPattern?: string;
  levels?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BatchDeleteRequest {
  ids?: string[];
  filter?: Omit<MessageFilter, 'page' | 'pageSize'>;
  all?: boolean;
}

export interface TTLSettings {
  verboseMinutes: number;
  debugMinutes: number;
  informationMinutes: number;
  warningMinutes: number;
  errorMinutes: number;
  fatalMinutes: number;
}
