import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';

vi.mock('../../services/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../services/api')>()) }));

const setEmbedded = (embedded: boolean) => {
  Object.defineProperty(window, 'top', { configurable: true, value: embedded ? ({} as Window) : window });
};

const importFresh = async () => {
  vi.resetModules();
  return import('../../utils/hostCommunication');
};

const fromHost = (data: unknown, origin = 'http://localhost') => window.dispatchEvent(new MessageEvent('message', { data, origin }));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  setEmbedded(false);
  vi.restoreAllMocks();
});

describe('HostCommunication', () => {
  it('only listens and sends when embedded in a host page', async () => {
    setEmbedded(false);
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication('*');
    const handler = vi.fn();
    hc.on('SET_THEME', handler);
    fromHost({ type: 'SET_THEME', data: { mode: 'dark' } });
    expect(hc.getIsEmbedded()).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    const post = vi.spyOn(window.parent, 'postMessage');
    hc.notifyReady();
    expect(post).not.toHaveBeenCalled();
  });

  it('delivers host messages to subscribers and supports unsubscribe', async () => {
    setEmbedded(true);
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication('*');
    const handler = vi.fn();
    const off = hc.on('SET_THEME', handler);
    fromHost({ type: 'SET_THEME', data: { mode: 'dark' } });
    expect(handler).toHaveBeenCalledWith({ mode: 'dark' });
    off();
    fromHost({ type: 'SET_THEME', data: { mode: 'light' } });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed messages and survives a throwing handler', async () => {
    setEmbedded(true);
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication('*');
    const good = vi.fn();
    hc.on('DATA_UPDATE', () => {
      throw new Error('boom');
    });
    hc.on('DATA_UPDATE', good);
    fromHost(null);
    fromHost({ nope: true });
    fromHost('string');
    fromHost({ type: 'DATA_UPDATE', data: 1 });
    expect(good).toHaveBeenCalledWith(1);
  });

  it('rejects messages from other origins when a host origin is configured', async () => {
    setEmbedded(true);
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication('https://host.example');
    const handler = vi.fn();
    hc.on('SET_THEME', handler);
    fromHost({ type: 'SET_THEME', data: {} }, 'https://evil.example');
    expect(handler).not.toHaveBeenCalled();
    fromHost({ type: 'SET_THEME', data: {} }, 'https://host.example');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reads the allowed origin from VITE_HOST_ORIGIN and posts only to it', async () => {
    setEmbedded(true);
    vi.stubEnv('VITE_HOST_ORIGIN', 'https://host.example');
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication();
    const post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    hc.notifyHeightChange(320);
    expect(post).toHaveBeenCalledWith({ type: 'HEIGHT_CHANGE', data: { height: 320 } }, 'https://host.example');
    vi.unstubAllEnvs();
  });

  it('sends ready, data-change, navigation and error messages to the parent', async () => {
    setEmbedded(true);
    const { HostCommunication } = await importFresh();
    const hc = new HostCommunication('*');
    const post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    hc.notifyReady();
    hc.notifyDataChange('contact', { id: '1' });
    hc.requestNavigation('/deals');
    hc.notifyError('x', { a: 1 });
    expect(post.mock.calls.map((c) => (c[0] as any).type)).toEqual(['READY', 'DATA_CHANGE', 'NAVIGATION_REQUEST', 'ERROR']);
  });
});

describe('useHostDataSync (host -> stores)', () => {
  const setup = async () => {
    setEmbedded(true);
    vi.resetModules();
    const { hostCommunication } = await import('../../utils/hostCommunication');
    const { useHostDataSync } = await import('../../hooks/useHostDataSync');
    const { useContactStore } = await import('../../store/contactStore');
    const { useDealStore } = await import('../../store/dealStore');
    const { useTaskStore } = await import('../../store/taskStore');
    useContactStore.setState({ contacts: {} });
    useDealStore.setState({ deals: {} });
    useTaskStore.setState({ tasks: {} });
    renderHook(() => useHostDataSync());
    return { hostCommunication, useContactStore, useDealStore, useTaskStore };
  };

  it('loads the initial data into the stores keyed by id', async () => {
    const { useContactStore, useDealStore, useTaskStore } = await setup();
    act(() =>
      fromHost({ type: 'INITIAL_DATA_SYNC', data: { contacts: [{ id: 'c1', name: 'Ada' }], deals: [{ id: 'd1', company: 'X' }], tasks: [{ id: 't1', title: 'T' }] } })
    );
    expect(useContactStore.getState().contacts.c1.name).toBe('Ada');
    expect(useDealStore.getState().deals.d1.company).toBe('X');
    expect(useTaskStore.getState().tasks.t1.title).toBe('T');
  });

  it('creates, updates and deletes records from host updates', async () => {
    const { useContactStore } = await setup();
    act(() => fromHost({ type: 'DATA_UPDATE', data: { entityType: 'contact', operation: 'create', payload: { id: 'c1', name: 'Ada' } } }));
    expect(useContactStore.getState().contacts.c1.name).toBe('Ada');
    act(() => fromHost({ type: 'DATA_UPDATE', data: { entityType: 'contact', operation: 'update', payload: { id: 'c1', name: 'Ada L' } } }));
    expect(useContactStore.getState().contacts.c1.name).toBe('Ada L');
    act(() => fromHost({ type: 'DATA_UPDATE', data: { entityType: 'contact', operation: 'delete', payload: { id: 'c1' } } }));
    expect(useContactStore.getState().contacts).toEqual({});
  });

  it('ignores records without an id instead of storing them under "undefined"', async () => {
    const { useContactStore } = await setup();
    act(() => fromHost({ type: 'INITIAL_DATA_SYNC', data: { contacts: [{ name: 'no id' }, null, { id: 'c2', name: 'ok' }] } }));
    expect(Object.keys(useContactStore.getState().contacts)).toEqual(['c2']);
    act(() => fromHost({ type: 'DATA_UPDATE', data: { entityType: 'contact', operation: 'create', payload: { name: 'no id' } } }));
    act(() => fromHost({ type: 'DATA_UPDATE', data: undefined }));
    expect(Object.keys(useContactStore.getState().contacts)).toEqual(['c2']);
  });

  it('does nothing when the app is not embedded', async () => {
    setEmbedded(false);
    vi.resetModules();
    const { useHostDataSync } = await import('../../hooks/useHostDataSync');
    const { useContactStore } = await import('../../store/contactStore');
    useContactStore.setState({ contacts: {} });
    renderHook(() => useHostDataSync());
    act(() => fromHost({ type: 'INITIAL_DATA_SYNC', data: { contacts: [{ id: 'c1' }] } }));
    expect(useContactStore.getState().contacts).toEqual({});
  });
});

describe('EmbeddedAppWrapper + host theme', () => {
  it('announces READY when embedded and applies the host theme', async () => {
    setEmbedded(true);
    vi.resetModules();
    class RO { observe() {} disconnect() {} }
    (globalThis as any).ResizeObserver = RO;
    const post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    const { EmbeddedAppWrapper } = await import('../../components/EmbeddedAppWrapper');
    const { default: React } = await import('react');
    render(React.createElement(EmbeddedAppWrapper, null, React.createElement('div', null, 'app')));
    expect(post.mock.calls.some((c) => (c[0] as any).type === 'READY')).toBe(true);

    act(() => fromHost({ type: 'SET_THEME', data: { mode: 'dark', primaryColor: '#123456' } }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#123456');
    act(() => fromHost({ type: 'SET_THEME', data: { mode: 'light' } }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
