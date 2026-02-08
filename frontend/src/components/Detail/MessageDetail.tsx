import { format } from 'date-fns';
import type { WebhookMessage } from '../../types/webhook';
import { CopyButton } from '../common/CopyButton';
import { HeadersTable } from './HeadersTable';
import { BodyViewer } from './BodyViewer';

interface Props {
  message: WebhookMessage;
  onDelete: (id: string) => void;
}

export function MessageDetail({ message, onDelete }: Props) {
  return (
    <div style={{
      padding: '12px 16px',
      background: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
    }}>
      {/* Body — primary view */}
      <div style={{ marginBottom: 12 }}>
        <BodyViewer body={message.rawBody} />
      </div>

      {/* HTTP Metadata — collapsed by default */}
      <details style={{ marginBottom: 12 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#334155', marginBottom: 8, fontSize: 13 }}>
          HTTP Metadata
        </summary>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 12,
          fontSize: 13,
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Timestamp: </span>
            <span style={{ color: '#334155' }}>
              {format(new Date(message.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}
            </span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Path: </span>
            <span style={{ fontFamily: 'monospace', color: '#334155' }}>{message.path ?? 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Source IP: </span>
            <span style={{ fontFamily: 'monospace', color: '#334155' }}>{message.sourceIp ?? 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Size: </span>
            <span style={{ color: '#334155' }}>{message.contentLength} bytes</span>
          </div>
        </div>
        <details style={{ marginBottom: 8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#334155', marginBottom: 8, fontSize: 13 }}>
            Headers ({Object.keys(message.headers).length})
          </summary>
          <HeadersTable headers={message.headers} />
        </details>
      </details>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <CopyButton text={message.rawBody ?? ''} label="Copy JSON" />
        <button
          onClick={() => onDelete(message.id)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            border: '1px solid #fca5a5',
            borderRadius: 4,
            background: '#fef2f2',
            color: '#991b1b',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
