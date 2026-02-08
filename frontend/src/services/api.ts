import type { BatchDeleteRequest, MessageFilter, PagedResult, TTLSettings, WebhookMessage } from '../types/webhook';

const BASE = '/api';

function buildQuery(filter: MessageFilter): string {
  const params = new URLSearchParams();
  if (filter.pathContains) params.set('pathContains', filter.pathContains);
  if (filter.searchPattern) params.set('searchPattern', filter.searchPattern);
  if (filter.levels) params.set('levels', filter.levels);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  params.set('page', String(filter.page));
  params.set('pageSize', String(filter.pageSize));
  return params.toString();
}

export async function fetchMessages(filter: MessageFilter): Promise<PagedResult<WebhookMessage>> {
  const res = await fetch(`${BASE}/messages?${buildQuery(filter)}`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function fetchMessage(id: string): Promise<WebhookMessage> {
  const res = await fetch(`${BASE}/messages/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch message: ${res.status}`);
  return res.json();
}

export async function deleteMessage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/messages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete message: ${res.status}`);
}

export async function batchDelete(request: BatchDeleteRequest): Promise<{ deleted: number; ids?: string[] }> {
  const res = await fetch(`${BASE}/messages`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to batch delete: ${res.status}`);
  return res.json();
}

export async function fetchSettings(): Promise<TTLSettings> {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.status}`);
  return res.json();
}

export async function updateSettings(settings: TTLSettings): Promise<TTLSettings> {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to update settings: ${res.status}`);
  return res.json();
}
