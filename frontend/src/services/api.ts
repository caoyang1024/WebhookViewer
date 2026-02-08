import type { BatchDeleteRequest, MessageFilter, PagedResult, TTLSettings, WebhookMessage } from '../types/webhook';
import type { CreateUserRequest, LoginRequest, UpdateUserRequest, UserInfo } from '../types/auth';

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
  const res = await fetch(`${BASE}/messages?${buildQuery(filter)}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function fetchMessage(id: string): Promise<WebhookMessage> {
  const res = await fetch(`${BASE}/messages/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch message: ${res.status}`);
  return res.json();
}

export async function deleteMessage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/messages/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to delete message: ${res.status}`);
}

export async function batchDelete(request: BatchDeleteRequest): Promise<{ deleted: number; ids?: string[] }> {
  const res = await fetch(`${BASE}/messages`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to batch delete: ${res.status}`);
  return res.json();
}

export async function fetchSettings(): Promise<TTLSettings> {
  const res = await fetch(`${BASE}/settings`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.status}`);
  return res.json();
}

export async function updateSettings(settings: TTLSettings): Promise<TTLSettings> {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to update settings: ${res.status}`);
  return res.json();
}

// Auth API

export async function login(request: LoginRequest): Promise<UserInfo> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Invalid username or password');
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/me/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? 'Failed to change password');
  }
}

export async function fetchUsers(): Promise<UserInfo[]> {
  const res = await fetch(`${BASE}/auth/users`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  return res.json();
}

export async function createUser(request: CreateUserRequest): Promise<UserInfo> {
  const res = await fetch(`${BASE}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`);
  return res.json();
}

export async function updateUser(username: string, request: UpdateUserRequest): Promise<UserInfo> {
  const res = await fetch(`${BASE}/auth/users/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
  return res.json();
}

export async function deleteUser(username: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
}
