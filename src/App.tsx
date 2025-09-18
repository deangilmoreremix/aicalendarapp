import React, { useState } from 'react';
import { Calendar, Search, List, Activity, Columns, Moon, Sun, Brain } from 'lucide-react';
import { BigTaskCalendar } from './components/BigTaskCalendar';
import { TaskKanbanBoard } from './components/TaskKanbanBoard';
import { ActivityFeed } from './components/ActivityFeed';
import RecentActivity from './components/RecentActivity';
import TaskStats from './components/TaskStats';
import { useTheme } from './contexts/ThemeContext';
import { useAI } from './contexts/AIContext';
import { Task, TaskFilters } from './types';
import { useTaskStore } from './store/taskStore';
import { useContactStore } from './store/contactStore';
import { formatDate, getPriorityColor, getCategoryColor } from './utils';
import { InteractiveContactScorer } from './components/InteractiveContactScorer';
import { TasksAndFunnel } from './components/TasksAndFunnel';
import { InteractionHistory } from './components/InteractionHistory';
import { QuickActions } from './components/QuickActions';
import { CustomerProfile } from './components/CustomerProfile';
import { ContactsModal } from './components/ContactsModal';
import { NewContactModal } from './components/NewContactModal';
import { NewDealModal } from './components/NewDealModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';

const App: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { insights, generateInsights } = useAI();
  const { tasks, markTaskComplete } = useTaskStore();
  const { contacts } = useContactStore();
  const [view, setView] = useState<'calendar' | 'kanban' | 'list' | 'activity'>('calendar');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);

  const TaskListView: React.FC = () => {
    const filteredTasks = Object.values(tasks).filter(task => {
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.statuses && !filters.statuses.includes(task.status)) {
        return false;
      }
      if (filters.priorities && !filters.priorities.includes(task.priority)) {
        return false;
      }
      return true;
    });

    return (
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${
        isDark 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Tasks</h2>
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    isDark 
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Filters */}
              <select
                value={filters.statuses?.[0] || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, statuses: e.target.value === 'all' ? undefined : [e.target.value as Task['status']] }))}
                className={`px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.priorities?.[0] || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, priorities: e.target.value === 'all' ? undefined : [e.target.value as Task['priority']] }))}
                className={`px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className={`divide-y max-h-96 overflow-y-auto ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
          {filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setShowTaskDetailsModal(true);
              }}
              className={`p-4 cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      markTaskComplete(task.id, e.target.checked);
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className={`font-medium ${
                      task.completed 
                        ? 'line-through text-gray-500' 
                        : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className={`text-sm mt-1 truncate max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getCategoryColor(task.type)}`}>
                        {task.type}
                      </span>
                    </div>
                  </div>
                </div>
                {task.dueDate && (
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      !task.completed && task.dueDate < new Date()
                        ? 'text-red-600'
                        : isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'calendar':
        return <BigTaskCalendar />;
      case 'kanban':
        return <TaskKanbanBoard />;
      case 'activity':
        return <ActivityFeed />;
      case 'list':
        return <TaskListView />;
      default:
        return <BigTaskCalendar />;
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await generateInsights(Object.values(contacts));
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-8 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Calendar</h1>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage your tasks and schedule with intelligent insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* View Toggle */}
            <div className={`rounded-xl p-1 shadow-sm border flex ${
              isDark 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : isDark 
                      ? 'text-gray-300 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar size={18} />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'kanban' 
                    ? 'bg-blue-600 text-white' 
                    : isDark 
                      ? 'text-gray-300 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Columns size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : isDark 
                      ? 'text-gray-300 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView('activity')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'activity' 
                    ? 'bg-blue-600 text-white' 
                    : isDark 
                      ? 'text-gray-300 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Activity size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Task Statistics */}
      <TaskStats />

      {/* AI Insights Banner */}
      {insights.length > 0 && (
        <div className={`rounded-2xl shadow-sm border p-6 mb-8 ${
          isDark 
            ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20' 
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Insights
              <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                {insights.length}
              </span>
            </h3>
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
            >
              {showAIInsights ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showAIInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className={`p-4 rounded-xl ${
                  isDark ? 'bg-white/5' : 'bg-white/70'
                }`}>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {insight.title}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      insight.type === 'opportunity' ? 'bg-green-100 text-green-800' :
                      insight.type === 'risk' ? 'bg-red-100 text-red-800' :
                      insight.type === 'engagement' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {insight.confidence}% confidence
                    </span>
                    {insight.actionable && (
                      <span className="text-xs text-purple-600 font-medium">Actionable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        onNewContact={() => setShowNewContactModal(true)}
        onContactsView={() => setShowContactsModal(true)}
        onNewDeal={() => setShowNewDealModal(true)}
      />

      {/* Recent Activity Dashboard */}
      <RecentActivity />

      {/* Tasks and Funnel */}
      <TasksAndFunnel />

      {/* Interaction History */}
      <InteractionHistory />

      {/* Enhanced Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Interactive Contact Scorer */}
        <div className="lg:col-span-2">
          <InteractiveContactScorer />
        </div>
        
        {/* Customer Profile */}
        <div>
          {/* AI Insights Generator */}
          <button
            onClick={handleGenerateInsights}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-colors mb-4 w-full justify-center"
          >
            <Brain className="w-4 h-4" />
            <span>Generate AI Insights</span>
          </button>
          <CustomerProfile />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {renderView()}
      </div>

      {/* Contact Modals */}
      <ContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
      
      <NewContactModal
        isOpen={showNewContactModal}
        onClose={() => setShowNewContactModal(false)}
      />

      <NewDealModal
        isOpen={showNewDealModal}
        onClose={() => setShowNewDealModal(false)}
      />

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={showTaskDetailsModal}
          onClose={() => {
            setShowTaskDetailsModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default App;