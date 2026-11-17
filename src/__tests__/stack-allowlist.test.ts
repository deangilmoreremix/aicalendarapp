import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Stack: Netlify + Supabase + OpenAI only.
const BANNED = [/gemini/i, /googleapis/i, /pexels\.com/i, /ui-avatars/i, /accounts\.google\.com/i, /login\.microsoftonline/i, /api\.anthropic/i, /generativelanguage/i];
const ROOTS = ['src', 'supabase'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|sql|toml)$/.test(name) && !name.includes('stack-allowlist')) out.push(p);
  }
  return out;
}

describe('stack allowlist', () => {
  it('references no services outside Netlify/Supabase/OpenAI', () => {
    const hits: string[] = [];
    for (const root of ROOTS) {
      for (const file of walk(root)) {
        const text = readFileSync(file, 'utf8');
        for (const re of BANNED) if (re.test(text)) hits.push(`${file}: ${re}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('does not depend on googleapis', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain('googleapis');
  });
});
