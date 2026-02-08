import type { PagedResult, WebhookMessage } from '../../types/webhook';
import { Spinner } from '../common/Spinner';
import { MessageRow } from './MessageRow';
import { Pagination } from './Pagination';

interface Props {
  data: PagedResult<WebhookMessage>;
  loading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function MessageList({ data, loading, selectedIds, onToggleSelect, onDelete, onPageChange }: Props) {
  if (loading && data.items.length === 0) {
    return <Spinner />;
  }

  if (data.items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 20px',
        color: '#94a3b8',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{ '\uD83D\uDCED' }</div>
        <p style={{ margin: 0, fontSize: 16 }}>No webhook messages yet</p>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>
          Send a request to <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 3 }}>/api/webhook/your-path</code> to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ borderTop: '1px solid #e2e8f0' }}>
        {data.items.map(msg => (
          <MessageRow
            key={msg.id}
            message={msg}
            selected={selectedIds.has(msg.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
