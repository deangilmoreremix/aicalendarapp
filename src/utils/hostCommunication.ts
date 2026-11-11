export type HostMessageType =
  | 'SET_THEME'
  | 'INITIAL_DATA_SYNC'
  | 'DATA_UPDATE'
  | 'AUTH_STATUS'
  | 'NAVIGATION'
  | 'CONFIG_UPDATE';

export type EmbeddedMessageType =
  | 'READY'
  | 'BUTTON_CLICK'
  | 'DATA_CHANGE'
  | 'NAVIGATION_REQUEST'
  | 'ERROR'
  | 'HEIGHT_CHANGE';

export interface HostMessage {
  type: HostMessageType;
  data?: any;
}

export interface EmbeddedMessage {
  type: EmbeddedMessageType;
  data?: any;
}

export class HostCommunication {
  private hostOrigin: string;
  private listeners: Map<HostMessageType, Set<(data: any) => void>>;
  private isEmbedded: boolean;

  constructor(hostOrigin?: string) {
    // Set VITE_HOST_ORIGIN (e.g. https://app.example.com) so only the host page can send messages to the embedded app
    // and receive its messages. Without it every origin is accepted, which is only appropriate for local development.
    this.hostOrigin = hostOrigin || (import.meta.env?.VITE_HOST_ORIGIN as string | undefined) || '*';
    this.listeners = new Map();
    this.isEmbedded = window.self !== window.top;

    if (this.isEmbedded) {
      if (this.hostOrigin === '*') {
        console.warn('[CRM Embed] VITE_HOST_ORIGIN is not set: messages from any origin are accepted.');
      }
      this.initializeListener();
    }
  }

  private initializeListener() {
    window.addEventListener('message', (event: MessageEvent) => {
      if (this.hostOrigin !== '*' && event.origin !== this.hostOrigin) {
        console.warn('[CRM Embed] Message from unauthorized origin:', event.origin);
        return;
      }

      const message = event.data as HostMessage;
      if (!message || !message.type) return;

      const handlers = this.listeners.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('[CRM Embed] Error in message handler:', error);
          }
        });
      }
    });
  }

  on(type: HostMessageType, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => this.off(type, handler);
  }

  off(type: HostMessageType, handler: (data: any) => void) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(type: EmbeddedMessageType, data?: any) {
    if (!this.isEmbedded) {
      console.warn('[CRM Embed] Not running in embedded mode');
      return;
    }

    const message: EmbeddedMessage = { type, data };
    window.parent.postMessage(message, this.hostOrigin);
  }

  notifyReady() {
    this.send('READY', {
      timestamp: Date.now(),
      version: '1.0.0',
    });
  }

  notifyHeightChange(height: number) {
    this.send('HEIGHT_CHANGE', { height });
  }

  notifyDataChange(changeType: string, data: any) {
    this.send('DATA_CHANGE', { changeType, data });
  }

  requestNavigation(path: string) {
    this.send('NAVIGATION_REQUEST', { path });
  }

  notifyError(error: string, details?: any) {
    this.send('ERROR', { error, details });
  }

  getIsEmbedded(): boolean {
    return this.isEmbedded;
  }

  setHostOrigin(origin: string) {
    this.hostOrigin = origin;
  }
}

export const hostCommunication = new HostCommunication();
