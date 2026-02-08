import * as signalR from '@microsoft/signalr';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

let connection: signalR.HubConnection | null = null;
let statusCallback: ((status: ConnectionStatus) => void) | null = null;

export function getConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/webhook')
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
    .build();

  connection.onreconnecting(() => statusCallback?.('reconnecting'));
  connection.onreconnected(() => statusCallback?.('connected'));
  connection.onclose(() => statusCallback?.('disconnected'));

  return connection;
}

export function onStatusChange(cb: (status: ConnectionStatus) => void) {
  statusCallback = cb;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      statusCallback?.('connected');
    } catch {
      statusCallback?.('disconnected');
      // retry after 5s
      setTimeout(() => startConnection(), 5000);
    }
  }
}

export function stopConnection(): Promise<void> {
  if (connection) return connection.stop();
  return Promise.resolve();
}
