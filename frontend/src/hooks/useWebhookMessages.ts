import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMessages } from '../services/api';
import { getConnection, startConnection, stopConnection, onStatusChange, type ConnectionStatus } from '../services/signalr';
import type { MessageFilter, PagedResult, WebhookMessage } from '../types/webhook';

export function useWebhookMessages(filter: MessageFilter) {
  const [data, setData] = useState<PagedResult<WebhookMessage>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMessages(filterRef.current);
      setData(result);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on filter change
  useEffect(() => {
    load();
  }, [filter, load]);

  // SignalR
  useEffect(() => {
    onStatusChange(setConnectionStatus);

    const conn = getConnection();

    conn.on('NewMessage', () => {
      load();
    });

    conn.on('MessageDeleted', (id: string) => {
      setData(prev => ({
        ...prev,
        items: prev.items.filter(m => m.id !== id),
        totalCount: prev.totalCount - 1,
      }));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });

    conn.on('MessagesDeleted', (ids: string[]) => {
      const idSet = new Set(ids);
      setData(prev => ({
        ...prev,
        items: prev.items.filter(m => !idSet.has(m.id)),
        totalCount: prev.totalCount - ids.length,
      }));
      setSelectedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    });

    conn.on('AllMessagesDeleted', () => {
      setData(prev => ({
        ...prev,
        items: [],
        totalCount: 0,
        totalPages: 0,
      }));
      setSelectedIds(new Set());
    });

    startConnection();

    return () => {
      conn.off('NewMessage');
      conn.off('MessageDeleted');
      conn.off('MessagesDeleted');
      conn.off('AllMessagesDeleted');
      stopConnection();
    };
  }, [load]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(data.items.map(m => m.id)));
  }, [data.items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    data,
    loading,
    connectionStatus,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    refresh: load,
  };
}
