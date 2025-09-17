import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import {
  X,
  Search,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Home,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  SortAsc,
  Grid,
  List,
  MapPin,
  Loader2
} from 'lucide-react';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (destination: string, params?: any) => void;
  currentView?: string;
}

interface NavigationOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'views' | 'sections' | 'tools' | 'reports';
  color: string;
  badge?: string;
  disabled?: boolean;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentView = 'dashboard'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'views' | 'sections' | 'tools' | 'reports'>('all');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const navigationOptions: NavigationOption[] = [
    // Views
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Main overview and quick actions',
      icon: Home,
      category: 'views',
      color: 'text-blue-600',
      badge: currentView === 'dashboard' ? 'Current' : undefined
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      description: 'Schedule and timeline visualization',
      icon: Calendar,
      category: 'views',
      color: 'text-green-600',
      badge: currentView === 'calendar' ? 'Current' : undefined
    },
    {
      id: 'kanban',
      label: 'Kanban Board',
      description: 'Task management with drag & drop',
      icon: Grid,
      category: 'views',
      color: 'text-purple-600',
      badge: currentView === 'kanban' ? 'Current' : undefined
    },
    {
      id: 'list',
      label: 'Task List',
      description: 'Detailed task list with filters',
      icon: List,
      category: 'views',
      color: 'text-orange-600',
      badge: currentView === 'list' ? 'Current' : undefined
    },

    // Sections
    {
      id: 'tasks',
      label: 'All Tasks',
      description: 'Complete task management',
      icon: CheckCircle,
      category: 'sections',
      color: 'text-indigo-600'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      description: 'CRM and contact management',
      icon: Users,
      category: 'sections',
      color: 'text-cyan-600'
    },
    {
      id: 'deals',
      label: 'Deals & Pipeline',
      description: 'Sales pipeline and opportunities',
      icon: BarChart3,
      category: 'sections',
      color: 'text-emerald-600'
    },
    {
      id: 'meetings',
      label: 'Meetings',
      description: 'Scheduled meetings and calls',
      icon: Clock,
      category: 'sections',
      color: 'text-amber-600'
    },

    // Tools
    {
      id: 'ai-insights',
      label: 'AI Insights',
      description: 'AI-powered analytics and recommendations',
      icon: BarChart3,
      category: 'tools',
      color: 'text-pink-600'
    },
    {
      id: 'email-composer',
      label: 'Email Composer',
      description: 'AI-assisted email composition',
      icon: Settings,
      category: 'tools',
      color: 'text-teal-600'
    },
    {
      id: 'meeting-scheduler',
      label: 'Meeting Scheduler',
      description: 'AI-optimized meeting planning',
      icon: Calendar,
      category: 'tools',
      color: 'text-violet-600'
    },

    // Reports
    {
      id: 'productivity-report',
      label: 'Productivity Report',
      description: 'Task completion and time tracking',
      icon: BarChart3,
      category: 'reports',
      color: 'text-red-600'
    },
    {
      id: 'team-performance',
      label: 'Team Performance',
      description: 'Team metrics and collaboration stats',
      icon: Users,
      category: 'reports',
      color: 'text-blue-600'
    },
    {
      id: 'sales-analytics',
      label: 'Sales Analytics',
      description: 'Deal conversion and pipeline analysis',
      icon: BarChart3,
      category: 'reports',
      color: 'text-green-600'
    }
  ];

  const categories = [
    { id: 'all', label: 'All', count: navigationOptions.length },
    { id: 'views', label: 'Views', count: navigationOptions.filter(o => o.category === 'views').length },
    { id: 'sections', label: 'Sections', count: navigationOptions.filter(o => o.category === 'sections').length },
    { id: 'tools', label: 'Tools', count: navigationOptions.filter(o => o.category === 'tools').length },
    { id: 'reports', label: 'Reports', count: navigationOptions.filter(o => o.category === 'reports').length }
  ];

  // Filter options based on search and category
  const filteredOptions = navigationOptions.filter(option => {
    const matchesSearch = option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         option.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || option.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNavigate = async (option: NavigationOption) => {
    if (option.disabled) return;

    setIsLoading(option.id);
    try {
      // Simulate navigation delay
      await new Promise(resolve => setTimeout(resolve, 500));

      onNavigate?.(option.id);
      onClose();
    } catch (error) {
      console.error(`Failed to navigate to ${option.label}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'views': return 'bg-blue-100 text-blue-800';
      case 'sections': return 'bg-green-100 text-green-800';
      case 'tools': return 'bg-purple-100 text-purple-800';
      case 'reports': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-5 h-5 text-blue-500" />
              <DialogTitle>Navigate</DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search navigation options..."
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>

          {/* Navigation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOptions.map(option => {
              const Icon = option.icon;
              const isCurrentlyLoading = isLoading === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleNavigate(option)}
                  disabled={option.disabled || isCurrentlyLoading}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition-all duration-200 group ${
                    option.disabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      option.disabled ? 'bg-gray-200' : 'bg-gray-100 group-hover:bg-blue-100'
                    }`}>
                      {isCurrentlyLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      ) : (
                        <Icon className={`w-5 h-5 ${option.color} group-hover:text-blue-600`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {option.label}
                        </h4>
                        {option.badge && (
                          <Badge className={
                            option.badge === 'Current'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }>
                            {option.badge}
                          </Badge>
                        )}
                        <Badge className={getCategoryColor(option.category)}>
                          {option.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {option.description}
                      </p>
                      {isCurrentlyLoading && (
                        <div className="flex items-center space-x-2 text-xs text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Navigating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Navigation */}
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Navigation</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(navigationOptions.find(o => o.id === 'dashboard')!)}
                disabled={isLoading === 'dashboard'}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Home className="w-4 h-4" />
                <span className="text-xs">Home</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(navigationOptions.find(o => o.id === 'tasks')!)}
                disabled={isLoading === 'tasks'}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Tasks</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(navigationOptions.find(o => o.id === 'contacts')!)}
                disabled={isLoading === 'contacts'}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">Contacts</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(navigationOptions.find(o => o.id === 'calendar')!)}
                disabled={isLoading === 'calendar'}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Calendar</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};