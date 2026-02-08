import { useState } from 'react';
import { format } from 'date-fns';
import type { WebhookMessage } from '../../types/webhook';
import { LevelBadge } from '../common/LevelBadge';
import { MessageDetail } from '../Detail/MessageDetail';

interface Props {
  message: WebhookMessage;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MessageRow({ message, selected, onToggleSelect, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          cursor: 'pointer',
          background: selected ? '#eff6ff' : expanded ? '#f8fafc' : 'transparent',
          transition: 'background 0.15s',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(message.id);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', minWidth: 75 }}>
          {format(new Date(message.timestamp), 'HH:mm:ss.SSS')}
        </span>
        <LevelBadge level={message.level} />
        <span style={{
          fontSize: 13,
          color: '#334155',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {message.preview ?? '(empty)'}
        </span>
        {message.path && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
            {message.path}
          </span>
        )}
        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>
          {message.contentLength} B
        </span>
        <span style={{ fontSize: 14, color: '#94a3b8', width: 20, textAlign: 'center' }}>
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>
      {expanded && <MessageDetail message={message} onDelete={onDelete} />}
    </div>
  );
}
