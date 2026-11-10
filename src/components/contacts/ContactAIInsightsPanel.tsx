import React, { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import type { AIInsight } from '../../types';
import type { Contact } from '../../types';

/** AI insights for one contact, generated on demand via the OpenAI-backed edge function. */
export const ContactAIInsightsPanel: React.FC<{ contact: Contact }> = ({ contact }) => {
  const { generateInsights } = useAI();
  const [insights, setInsights] = useState<AIInsight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setInsights(await generateInsights([contact]));
    } catch (err) {
      console.error('Insights failed:', err);
      setError('Could not generate insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
          {insights ? 'Refresh' : 'Generate'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!insights && !loading && !error && <p className="text-sm text-gray-600">Generate insights for {contact.name || 'this contact'}.</p>}
      {insights && insights.length === 0 && <p className="text-sm text-gray-600">No insights returned.</p>}
      {insights?.map(insight => (
        <div key={insight.id} className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
          <p className="text-sm text-gray-600">{insight.description}</p>
          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
              {insight.suggestedActions.map(a => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
