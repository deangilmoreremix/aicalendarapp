import React, { useState } from 'react';
import { useAI } from '../../contexts/AIContext';
import { Contact } from '../../types';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import {
  Search,
  Brain,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  MessageCircle,
  Youtube,
  Github,
  Camera,
  Music,
  Gamepad2,
  MessageSquare,
  Phone,
  Video,
  Globe
} from 'lucide-react';

interface AISocialMediaSearchProps {
  contact?: Contact;
  onResults?: (results: any) => void;
}

const platformIcons: Record<string, React.ElementType> = {
  linkedin: Users,
  twitter: MessageCircle,
  facebook: Users,
  instagram: Camera,
  youtube: Youtube,
  tiktok: Music,
  snapchat: Camera,
  github: Github,
  medium: MessageSquare,
  behance: Camera,
  dribbble: Camera,
  twitch: Gamepad2,
  discord: MessageSquare,
  telegram: MessageSquare,
  whatsapp: Phone,
  zoom: Video,
  clubhouse: MessageSquare,
  website: Globe,
};

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-500',
  twitter: 'bg-blue-400',
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-500',
  youtube: 'bg-red-500',
  tiktok: 'bg-black',
  snapchat: 'bg-yellow-500',
  github: 'bg-gray-800',
  medium: 'bg-black',
  behance: 'bg-blue-500',
  dribbble: 'bg-pink-400',
  twitch: 'bg-purple-500',
  discord: 'bg-indigo-500',
  telegram: 'bg-blue-500',
  whatsapp: 'bg-green-500',
  zoom: 'bg-blue-600',
  clubhouse: 'bg-orange-500',
  website: 'bg-gray-500',
};

export const AISocialMediaSearch: React.FC<AISocialMediaSearchProps> = ({
  contact,
  onResults
}) => {
  const {
    searchSocialMediaProfiles,
    searchAllPlatforms,
    verifySocialProfiles,
    getSocialMediaInsights,
    isProcessing
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'quick' | 'comprehensive'>('quick');
  const [insights, setInsights] = useState<any>(null);

  const handleQuickSearch = async () => {
    if (!searchQuery.trim() && !contact) return;

    try {
      const contactData = contact || {
        firstName: searchQuery.split(' ')[0],
        lastName: searchQuery.split(' ').slice(1).join(' '),
        email: '',
        company: ''
      };

      const results = await searchSocialMediaProfiles(contactData);
      setSearchResults(results.aiSearchResults || []);
      onResults?.(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleComprehensiveSearch = async () => {
    if (!searchQuery.trim() && !contact) return;

    try {
      const contactData = contact || {
        firstName: searchQuery.split(' ')[0],
        lastName: searchQuery.split(' ').slice(1).join(' '),
        email: '',
        company: ''
      };

      const results = await searchAllPlatforms(contactData);
      setSearchResults(results.aiSearchResults || []);
      onResults?.(results);
    } catch (error) {
      console.error('Comprehensive search failed:', error);
    }
  };

  const handleVerifyProfiles = async () => {
    if (searchResults.length === 0) return;

    try {
      const profiles: Record<string, string> = {};
      searchResults.forEach(result => {
        if (result.url) {
          profiles[result.platform] = result.url;
        }
      });

      const verificationResults = await verifySocialProfiles(profiles);

      setSearchResults(prev => prev.map(result => ({
        ...result,
        verified: verificationResults[result.platform] || false
      })));
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const handleGetInsights = async () => {
    if (!contact?.id) return;

    try {
      const insightsData = await getSocialMediaInsights(contact.id);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to get insights:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center space-x-2 text-lg font-semibold">
            <Brain className="w-5 h-5 text-purple-500" />
            <span>AI Social Media Search</span>
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {!contact && (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter name (e.g., 'John Smith')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleQuickSearch}
              disabled={isProcessing || (!searchQuery.trim() && !contact)}
              className="flex items-center space-x-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Quick Search</span>
            </Button>

            <Button
              onClick={handleComprehensiveSearch}
              disabled={isProcessing || (!searchQuery.trim() && !contact)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>Comprehensive Search</span>
            </Button>

            {searchResults.length > 0 && (
              <Button
                onClick={handleVerifyProfiles}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify Profiles</span>
              </Button>
            )}

            {contact && (
              <Button
                onClick={handleGetInsights}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>Get Insights</span>
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Quick Search:</strong> Searches major platforms (LinkedIn, Twitter, Instagram, GitHub, etc.)</p>
            <p><strong>Comprehensive Search:</strong> Searches 20+ platforms including YouTube, TikTok, Twitch, Discord, and more</p>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
              <Badge variant="secondary">
                {searchResults.filter(r => r.confidence > 80).length} high confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result, index) => {
                const Icon = platformIcons[result.platform] || Globe;
                const colorClass = platformColors[result.platform] || 'bg-gray-500';

                return (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${colorClass} p-2 rounded-lg`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{result.platform}</h4>
                          {result.username && (
                            <p className="text-sm text-gray-600">@{result.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={result.confidence > 80 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {result.confidence}%
                        </Badge>
                        {result.verified !== undefined && (
                          result.verified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {result.followers && (
                        <p>👥 {formatNumber(result.followers)} followers</p>
                      )}
                      {result.posts && (
                        <p>📝 {formatNumber(result.posts)} posts</p>
                      )}
                      {result.lastActive && (
                        <p>🕒 Active {new Date(result.lastActive).toLocaleDateString()}</p>
                      )}
                    </div>

                    {result.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit Profile
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Media Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <h3 className="flex items-center space-x-2 text-lg font-semibold">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>Social Media Insights</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{insights.totalPlatforms}</div>
                <div className="text-sm text-blue-800">Total Platforms</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{insights.activePlatforms}</div>
                <div className="text-sm text-green-800">Active Platforms</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(insights.totalFollowers)}</div>
                <div className="text-sm text-purple-800">Total Followers</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{insights.engagementRate}%</div>
                <div className="text-sm text-orange-800">Engagement Rate</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Key Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Posting Frequency:</span>
                    <span className="font-medium">{insights.postingFrequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Platform:</span>
                    <span className="font-medium">{insights.topPlatform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Influence Score:</span>
                    <span className="font-medium">{insights.influenceScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Activity:</span>
                    <span className="font-medium">{new Date(insights.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Content Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.contentThemes.map((theme: string, index: number) => (
                    <Badge key={index} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">AI Recommendations</h4>
                <ul className="space-y-1 text-sm">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isProcessing && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Social Media Profiles</h3>
            <p className="text-gray-600 mb-4">
              Use AI-powered search to discover social media profiles across multiple platforms
            </p>
            <div className="flex justify-center space-x-2 text-sm text-gray-500">
              <span>Supports 20+ platforms including:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub', 'TikTok', 'Discord', 'Twitch'].map(platform => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {platform}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};