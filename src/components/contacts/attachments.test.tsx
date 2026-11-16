import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- component tests (api mocked)
const api = vi.hoisted(() => ({ list: vi.fn(), upload: vi.fn(), remove: vi.fn(), url: vi.fn(), activityCreate: vi.fn() }));
vi.mock('../../services/api', async (orig) => {
  const actual = await orig<typeof import('../../services/api')>();
  return {
    ...actual,
    attachmentApi: { list: api.list, upload: api.upload, remove: api.remove, getDownloadUrl: api.url },
    activityApi: { ...actual.activityApi, create: api.activityCreate }
  };
});

import { RecordAttachments, formatBytes } from './RecordAttachments';

const att = (over: any = {}) => ({ id: 'a1', entityType: 'contact', entityId: 'c1', name: 'proposal.pdf', size: 2048, mimeType: 'application/pdf', storagePath: 'contact/c1/x-proposal.pdf', createdAt: new Date(2026, 10, 5), ...over });
const file = (name = 'note.txt', size = 10, type = 'text/plain') => new File([new Uint8Array(size)], name, { type });

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue([]);
  api.upload.mockImplementation(async (_t: string, _e: string, f: File) => att({ id: 'new', name: f.name, size: f.size }));
  api.activityCreate.mockResolvedValue({});
  api.remove.mockResolvedValue(undefined);
  api.url.mockResolvedValue('https://signed.example/x');
});

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect([formatBytes(12), formatBytes(2048), formatBytes(5 * 1024 * 1024)]).toEqual(['12 B', '2.0 KB', '5.0 MB']);
  });
});

describe('RecordAttachments', () => {
  it('lists files with size and date, and shows an empty state', async () => {
    const { unmount } = render(<RecordAttachments entityType="contact" entityId="c1" />);
    expect(await screen.findByText('No files yet.')).toBeInTheDocument();
    unmount();
    api.list.mockResolvedValue([att()]);
    render(<RecordAttachments entityType="contact" entityId="c1" />);
    expect(await screen.findByText('proposal.pdf')).toBeInTheDocument();
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
  });

  it('uploads chosen files and logs them on the timeline', async () => {
    render(<RecordAttachments entityType="deal" entityId="d1" />);
    await screen.findByText('No files yet.');
    const f = file('contract.docx', 100);
    fireEvent.change(screen.getByLabelText('Choose files to attach'), { target: { files: [f] } });
    await waitFor(() => expect(api.upload).toHaveBeenCalledWith('deal', 'd1', f));
    await waitFor(() => expect(api.activityCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'file_uploaded', entityType: 'deal', entityId: 'd1', title: 'File added: contract.docx' })));
    expect(api.list).toHaveBeenCalledTimes(2); // reloaded after the upload
  });

  it('accepts dropped files', async () => {
    render(<RecordAttachments entityType="task" entityId="t1" />);
    const zone = (await screen.findByText('Drop files here or')).parentElement!;
    const f = file('a.txt');
    fireEvent.drop(zone, { dataTransfer: { files: [f] } });
    await waitFor(() => expect(api.upload).toHaveBeenCalledWith('task', 't1', f));
  });

  it('keeps going after one file fails and reports it', async () => {
    api.upload.mockRejectedValueOnce(new Error('"big.zip" is larger than 25 MB.')).mockResolvedValueOnce(att({ name: 'ok.txt' }));
    render(<RecordAttachments entityType="contact" entityId="c1" />);
    await screen.findByText('No files yet.');
    fireEvent.change(screen.getByLabelText('Choose files to attach'), { target: { files: [file('big.zip'), file('ok.txt')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('"big.zip" is larger than 25 MB.');
    expect(api.upload).toHaveBeenCalledTimes(2);
  });

  it('an upload still counts when the timeline entry cannot be written', async () => {
    api.activityCreate.mockRejectedValue(new Error('down'));
    render(<RecordAttachments entityType="contact" entityId="c1" />);
    await screen.findByText('No files yet.');
    fireEvent.change(screen.getByLabelText('Choose files to attach'), { target: { files: [file()] } });
    await waitFor(() => expect(api.upload).toHaveBeenCalled());
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('downloads through a signed link opened without opener access', async () => {
    api.list.mockResolvedValue([att()]);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<RecordAttachments entityType="contact" entityId="c1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Download proposal.pdf' }));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://signed.example/x', '_blank', 'noopener,noreferrer'));
    expect(api.url).toHaveBeenCalledWith('contact/c1/x-proposal.pdf', 'proposal.pdf');
    open.mockRestore();
  });

  it('deletes after confirmation and shows an error if that fails', async () => {
    api.list.mockResolvedValue([att()]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    render(<RecordAttachments entityType="contact" entityId="c1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete proposal.pdf' }));
    expect(api.remove).not.toHaveBeenCalled();
    api.remove.mockRejectedValueOnce(new Error('x'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete proposal.pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete "proposal.pdf".');
    fireEvent.click(screen.getByRole('button', { name: 'Delete proposal.pdf' }));
    await waitFor(() => expect(screen.queryByText('proposal.pdf')).toBeNull());
    confirm.mockRestore();
  });
});
