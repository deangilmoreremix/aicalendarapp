import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader } from './card';
import { WebResearchContainer } from './StreamingContainer';
import { Citation } from './StreamingTextWithCitations';
import { Search, BookOpen, ExternalLink } from 'lucide-react';

export const WebResearchDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<string>('');
  const [citations, setCitations] = useState<Citation[]>([]);

  const handleResearch = async () => {
    if (!query.trim()) return;

    setIsResearching(true);
    setResults('');
    setCitations([]);

    // Simulate web research with streaming
    const mockResults = `Based on comprehensive web research for "${query}", here are the key findings:

## Latest Developments
Recent studies show significant advancements in AI-powered productivity tools. Companies are increasingly adopting intelligent automation to streamline workflows and enhance decision-making processes.

## Industry Trends
The market for AI-enhanced calendar and task management systems is growing rapidly, with a projected CAGR of 25% through 2026. Key drivers include:
- Increasing demand for intelligent automation
- Growing need for real-time insights
- Enhanced user experience requirements

## Best Practices
Leading organizations are implementing AI-driven solutions that provide:
- Predictive task prioritization
- Automated scheduling optimization
- Real-time performance analytics
- Intelligent recommendation systems

## Future Outlook
The integration of advanced AI capabilities with traditional productivity tools is expected to revolutionize how teams collaborate and manage their work. Emerging technologies like natural language processing and machine learning will further enhance these systems.`;

    const mockCitations: Citation[] = [
      {
        id: '1',
        title: 'AI Productivity Tools Market Report 2024',
        url: 'https://example.com/ai-productivity-report-2024',
        source: 'TechCrunch Research',
        publishDate: '2024-01-15',
        relevanceScore: 0.95,
        excerpt: 'Comprehensive analysis of AI tools market growth and adoption trends...'
      },
      {
        id: '2',
        title: 'Future of Work: AI Integration',
        url: 'https://example.com/future-work-ai-integration',
        source: 'Harvard Business Review',
        publishDate: '2024-02-20',
        relevanceScore: 0.88,
        excerpt: 'How AI is transforming workplace productivity and collaboration...'
      },
      {
        id: '3',
        title: 'Machine Learning in Task Management',
        url: 'https://example.com/ml-task-management',
        source: 'MIT Technology Review',
        publishDate: '2024-03-10',
        relevanceScore: 0.82,
        excerpt: 'Latest research on ML applications for intelligent task prioritization...'
      },
      {
        id: '4',
        title: 'Automation Trends 2024',
        url: 'https://example.com/automation-trends-2024',
        source: 'Forrester Research',
        publishDate: '2024-01-30',
        relevanceScore: 0.79,
        excerpt: 'Key trends shaping the automation landscape in enterprise environments...'
      }
    ];

    // Simulate streaming delay
    setTimeout(() => {
      setResults(mockResults);
      setCitations(mockCitations);
      setIsResearching(false);
    }, 3000);
  };

  const handleCitationClick = (citation: Citation) => {
    // In a real implementation, this would open the citation URL
    console.log('Opening citation:', citation.url);
    // For demo purposes, we'll just log it
    alert(`Opening: ${citation.title}\nSource: ${citation.source}\nURL: ${citation.url}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>AI Web Research with Citations</span>
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your research query (e.g., 'AI productivity tools market trends')"
                className="text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
              />
            </div>
            <Button
              onClick={handleResearch}
              disabled={!query.trim() || isResearching}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Search size={16} />
              <span>Research</span>
            </Button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            This demo showcases streaming AI responses with animated citations. Enter a research query to see the streaming research process in action.
          </p>
        </CardContent>
      </Card>

      {(isResearching || results) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-green-600" />
              <span>Research Results</span>
            </h3>
          </CardHeader>
          <CardContent>
            <WebResearchContainer
              query={query}
              onResult={(result, resultCitations) => {
                setResults(result);
                setCitations(resultCitations);
              }}
            />

            {results && (
              <div className="prose prose-sm max-w-none dark:prose-invert mt-6">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
                  {results}
                </div>

                {citations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      📚 Sources & Citations
                    </h4>
                    <div className="grid gap-3">
                      {citations.map((citation, index) => (
                        <div
                          key={citation.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                          onClick={() => handleCitationClick(citation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                                  [{index + 1}]
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {citation.source}
                                </span>
                                {citation.publishDate && (
                                  <span className="text-sm text-gray-500 dark:text-gray-500">
                                    {new Date(citation.publishDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {citation.title}
                              </h5>
                              {citation.excerpt && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {citation.excerpt}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                      i < Math.round(citation.relevanceScore * 5)
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {Math.round(citation.relevanceScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isResearching && !results && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Ready to Research
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter a research query above to see AI-powered web research with streaming responses and animated citations.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('AI productivity tools market analysis')}
              >
                AI Productivity Tools
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('future of work automation trends')}
              >
                Work Automation Trends
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery('machine learning task management')}
              >
                ML Task Management
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};