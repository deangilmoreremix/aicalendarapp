import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { OPENAI_KEY_CHANGED, clearOpenAIAuth, getOpenAIAuth, isPlausibleKey, saveOpenAIAuth } from '../lib/openaiKey';

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

/** Where the user adds their own OpenAI key (the app is bring-your-own-key: AI runs on the user's OpenAI account). */
export const OpenAIKeySettings: React.FC = () => {
  const [stored, setStored] = useState(() => getOpenAIAuth());
  const [key, setKey] = useState('');
  const [model, setModel] = useState(stored?.model ?? '');
  const [imageModel, setImageModel] = useState(stored?.imageModel ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const refresh = () => setStored(getOpenAIAuth());
    window.addEventListener(OPENAI_KEY_CHANGED, refresh);
    return () => window.removeEventListener(OPENAI_KEY_CHANGED, refresh);
  }, []);

  const save = () => {
    const apiKey = key.trim() || stored?.apiKey || '';
    if (!isPlausibleKey(apiKey)) {
      setMessage({ ok: false, text: 'That does not look like an OpenAI key. It starts with "sk-".' });
      return;
    }
    if (saveOpenAIAuth({ apiKey, model, imageModel })) {
      setKey('');
      setMessage({ ok: true, text: 'Saved in this browser.' });
    } else {
      setMessage({ ok: false, text: 'Your browser did not allow saving the key.' });
    }
  };

  const remove = () => {
    clearOpenAIAuth();
    setKey('');
    setModel('');
    setImageModel('');
    setMessage({ ok: true, text: 'Key removed from this browser.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> OpenAI key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          AI features run on your own OpenAI account. Your key is kept only in this browser and sent securely with each AI request; it is
          not stored on our servers. Use a key limited to this project, with a spend limit.
        </p>
        <p role="status" className="text-xs text-gray-700 dark:text-gray-300">
          {stored ? `A key is saved (ends in ${stored.apiKey.slice(-4)}).` : 'No key yet: AI features are off until you add one.'}
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">{stored ? 'Replace key' : 'OpenAI API key'}</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-label="OpenAI API key"
            placeholder="sk-..."
            className={inputClass}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-gray-500">Model (optional)</span>
            <input aria-label="OpenAI model" placeholder="default" className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-gray-500">Image model (optional)</span>
            <input aria-label="OpenAI image model" placeholder="default" className={inputClass} value={imageModel} onChange={(e) => setImageModel(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save key</Button>
          {stored && (
            <Button variant="outline" onClick={remove}>
              Remove key
            </Button>
          )}
        </div>
        {message && <p className={`text-xs ${message.ok ? 'text-gray-700 dark:text-gray-300' : 'text-red-600'}`}>{message.text}</p>}
      </CardContent>
    </Card>
  );
};
