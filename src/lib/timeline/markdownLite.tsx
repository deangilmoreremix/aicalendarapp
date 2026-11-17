/**
 * Markdown-lite for notes: **bold**, *italic*, `code`, [text](https://link), "- " / "* " bullet lists and line breaks.
 * Built as React elements (never an HTML string), so note text can never inject markup. Links must be http(s).
 * Twenty's notes use a block editor; that needs a heavy editor dependency, so this is the small version.
 */
import { Fragment, type ReactNode } from 'react';

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);

export const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*\s][^*]*\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part)) return <code key={i} className="rounded bg-gray-100 px-1 text-[0.9em] dark:bg-gray-700">{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      return isSafeUrl(link[2]) ? (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {link[1]}
        </a>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });

export const MarkdownLite = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} className="list-disc pl-5">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    list = [];
  };
  lines.forEach((line, i) => {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      blocks.push(<p key={`p${i}`} className={line.trim() ? '' : 'h-2'}>{renderInline(line)}</p>);
    }
  });
  flush();
  return <div className="space-y-0.5 text-sm text-gray-700 dark:text-gray-300">{blocks}</div>;
};
