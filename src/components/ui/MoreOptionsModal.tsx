import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import {
  X,
  Settings,
  Share,
  Download,
  Upload,
  Archive,
  Trash2,
  Copy,
  Filter,
  SortAsc,
  Bell,
  BellOff,
  Star,
  StarOff,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Loader2
} from 'lucide-react';

interface MoreOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptionSelected?: (option: string, data?: any) => void;
  context?: 'task' | 'project' | 'calendar' | 'general';
  title?: string;
}

interface Option {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'actions' | 'settings' | 'export' | 'collaboration';
  color: string;
  disabled?: boolean;
}

export const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
  isOpen,
  onClose,
  onOptionSelected,
  context = 'general',
  title = "More Options"
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'actions' | 'settings' | 'export' | 'collaboration'>('all');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const options: Option[] = [
    // Actions
    {
      id: 'duplicate',
      label: 'Duplicate',
      description: 'Create a copy of this item',
      icon: Copy,
      category: 'actions',
      color: 'text-blue-600'
    },
    {
      id: 'archive',
      label: 'Archive',
      description: 'Move to archive for later reference',
      icon: Archive,
      category: 'actions',
      color: 'text-yellow-600'
    },
    {
      id: 'delete',
      label: 'Delete',
      description: 'Permanently remove this item',
      icon: Trash2,
      category: 'actions',
      color: 'text-red-600'
    },

    // Settings
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      category: 'settings',
      color: 'text-purple-600'
    },
    {
      id: 'reminders',
      label: 'Set Reminder',
      description: 'Schedule reminders for this item',
      icon: Calendar,
      category: 'settings',
      color: 'text-green-600'
    },
    {
      id: 'priority',
      label: 'Change Priority',
      description: 'Update priority level',
      icon: Star,
      category: 'settings',
      color: 'text-orange-600'
    },

    // Export
    {
      id: 'export-pdf',
      label: 'Export as PDF',
      description: 'Download as PDF document',
      icon: Download,
      category: 'export',
      color: 'text-red-600'
    },
    {
      id: 'export-csv',
      label: 'Export as CSV',
      description: 'Download data as CSV file',
      icon: FileText,
      category: 'export',
      color: 'text-green-600'
    },
    {
      id: 'share-link',
      label: 'Share Link',
      description: 'Generate shareable link',
      icon: Share,
      category: 'export',
      color: 'text-blue-600'
    },

    // Collaboration
    {
      id: 'add-collaborators',
      label: 'Add Collaborators',
      description: 'Invite team members to collaborate',
      icon: Users,
      category: 'collaboration',
      color: 'text-indigo-600'
    },
    {
      id: 'view-activity',
      label: 'View Activity Log',
      description: 'See recent changes and updates',
      icon: BarChart3,
      category: 'collaboration',
      color: 'text-cyan-600'
    },
    {
      id: 'transfer-ownership',
      label: 'Transfer Ownership',
      description: 'Change the owner of this item',
      icon: Settings,
      category: 'collaboration',
      color: 'text-gray-600'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Options', count: options.length },
    { id: 'actions', label: 'Actions', count: options.filter(o => o.category === 'actions').length },
    { id: 'settings', label: 'Settings', count: options.filter(o => o.category === 'settings').length },
    { id: 'export', label: 'Export & Share', count: options.filter(o => o.category === 'export').length },
    { id: 'collaboration', label: 'Collaboration', count: options.filter(o => o.category === 'collaboration').length }
  ];

  const filteredOptions = selectedCategory === 'all'
    ? options
    : options.filter(option => option.category === selectedCategory);

  const handleOptionClick = async (option: Option) => {
    if (option.disabled) return;

    setIsLoading(option.id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onOptionSelected?.(option.id);
      onClose();
    } catch (error) {
      console.error(`Failed to execute ${option.label}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'actions': return 'bg-blue-100 text-blue-800';
      case 'settings': return 'bg-purple-100 text-purple-800';
      case 'export': return 'bg-green-100 text-green-800';
      case 'collaboration': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <DialogTitle>{title}</DialogTitle>
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

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOptions.map(option => {
              const Icon = option.icon;
              const isCurrentlyLoading = isLoading === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  disabled={option.disabled || isCurrentlyLoading}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition-all duration-200 ${
                    option.disabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      option.disabled ? 'bg-gray-200' : 'bg-gray-100'
                    }`}>
                      {isCurrentlyLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      ) : (
                        <Icon className={`w-5 h-5 ${option.color}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {option.label}
                        </h4>
                        <Badge className={getCategoryColor(option.category)}>
                          {option.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h5>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOptionClick(options.find(o => o.id === 'duplicate')!)}
                disabled={isLoading === 'duplicate'}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOptionClick(options.find(o => o.id === 'share-link')!)}
                disabled={isLoading === 'share-link'}
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOptionClick(options.find(o => o.id === 'export-pdf')!)}
                disabled={isLoading === 'export-pdf'}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
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