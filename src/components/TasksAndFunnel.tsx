import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { AvatarWithStatus } from './ui/AvatarWithStatus';
import { useAI } from '../contexts/AIContext';
import { ModernButton } from './ui/ModernButton';
import { AddUserModal } from './ui/AddUserModal';
import { MoreOptionsModal } from './ui/MoreOptionsModal';
import { NavigationModal } from './ui/NavigationModal';
import { AddTaskModal } from './ui/AddTaskModal';
import { MoreHorizontal, ArrowRight, Calendar, UserPlus, Users, Plus, Brain, Clock, Sparkles, Target, Loader2, TrendingUp } from 'lucide-react';

const taskData = [
  {
    day: 'Mon',
    tasks: 2,
    assignees: [
      { id: '1', name: 'Jane Doe', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '2', name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'inactive' }
    ]
  },
  {
    day: 'Tue',
    tasks: 0,
    assignees: []
  },
  {
    day: 'Wed',
    tasks: 3,
    assignees: [
      { id: '3', name: 'Darlene Robertson', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '4', name: 'Eva Robinson', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '5', name: 'Wade Warren', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'pending' }
    ]
  },
  {
    day: 'Thu',
    tasks: 1,
    assignees: [
      { id: '6', name: 'Jonah Jude', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' }
    ]
  },
  {
    day: 'Fri',
    tasks: 4,
    assignees: [
      { id: '1', name: 'Jane Doe', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '2', name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '3', name: 'Darlene Robertson', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '4', name: 'Eva Robinson', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' }
    ]
  },
  {
    day: 'Sat',
    tasks: 2,
    assignees: [
      { id: '5', name: 'Wade Warren', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' },
      { id: '6', name: 'Jonah Jude', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' }
    ]
  },
  {
    day: 'Sun',
    tasks: 1,
    assignees: [
      { id: '2', name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', status: 'active' }
    ]
  },
];

const funnelData = [
  { stage: 'Total in Pipeline', value: '350,500', color: 'bg-gray-600' },
  { stage: 'Qualification', value: '92,350$', color: 'bg-gray-500' },
  { stage: 'Royal Package Opportunity', value: '67,120$', color: 'bg-gray-400' },
  { stage: 'Value Proposition', value: '28,980$', color: 'bg-gray-300' },
];

export const TasksAndFunnel: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { optimizeMeetingTime, generateMeetingAgenda, isProcessing } = useAI();
  const [meetingSuggestions, setMeetingSuggestions] = useState<Date[]>([]);
  const [suggestedAgenda, setSuggestedAgenda] = useState<string[]>([]);
  const [isLoadingMeetingAI, setIsLoadingMeetingAI] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiAlerts, setAiAlerts] = useState<Array<{type: string, description: string}>>([]);
  const today = new Date().getDate();

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Load AI insights function
  const loadAIInsights = async () => {
    setIsLoadingAI(true);
    try {
      // Simulate loading AI insights
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiAlerts([
        { type: 'opportunity', description: 'High-value lead identified with 85% conversion probability' },
        { type: 'opportunity', description: 'Upsell potential detected for enterprise package' }
      ]);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Generate AI meeting suggestions when a day is selected
  useEffect(() => {
    if (selectedDay && selectedDay !== today) {
      generateMeetingOptimizations();
    }
  }, [selectedDay]);

  const generateMeetingOptimizations = async () => {
    if (!selectedDay) return;

    setIsLoadingMeetingAI(true);
    try {
      // Get attendees for the selected day
      const dayData = calendarData[selectedDay - 1];
      const attendeeIds = dayData.assignees.map(a => a.id);

      if (attendeeIds.length > 0) {
        // Get optimal meeting times
        const suggestions = await optimizeMeetingTime(attendeeIds, 60); // 60 minutes
        setMeetingSuggestions(suggestions);

        // Generate meeting agenda
        const agenda = await generateMeetingAgenda(
          `Team Sync - October ${selectedDay}`,
          dayData.assignees.map(a => a.name)
        );
        setSuggestedAgenda(agenda);
      }
    } catch (error) {
      console.error('Failed to generate meeting optimizations:', error);
    } finally {
      setIsLoadingMeetingAI(false);
    }
  };

  // Mock calendar data - for each day, randomly assign avatars based on our contacts
  const calendarData = Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
    // Randomly determine if this day has assignees
    const hasAssignees = Math.random() > 0.65;
    if (!hasAssignees) return { day, assignees: [] };

    // Get 1-4 random assignees from our task data
    const allAssignees = taskData.flatMap(t => t.assignees);
    const uniqueAssignees = [...new Map(allAssignees.map(a => [a.id, a])).values()];
    const shuffled = [...uniqueAssignees].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 4) + 1;

    return {
      day,
      assignees: shuffled.slice(0, count)
    };
  });

  const handleAssigneeClick = (id: string) => {
    console.log(`Clicked on assignee: ${id}`);
    // In a real implementation, this would open the contact details modal
    alert(`Contact details for ${id} would open here`);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    console.log(`Clicked on day: ${day}`);
    // In a real implementation, this might open a modal to create/view tasks for this day
    alert(`Task management for day ${day} would open here`);
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleMoreOptions = () => {
    setShowMoreOptionsModal(true);
  };

  const handleNavigate = () => {
    setShowNavigationModal(true);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleScheduleMeeting = () => {
    // In a real implementation, this would open the MeetingSchedulerModal
    // For now, we'll use an alert to indicate functionality
    alert('Meeting Scheduler Modal would open here with selected attendees');
  };

  // Modal event handlers
  const handleUsersAdded = (users: any[]) => {
    console.log('Users added:', users);
    alert(`${users.length} users added successfully!`);
  };

  const handleOptionSelected = async (option: string) => {
    console.log('Option selected:', option);

    try {
      switch (option) {
        case 'duplicate':
          await handleDuplicate();
          break;
        case 'archive':
          await handleArchive();
          break;
        case 'delete':
          await handleDelete();
          break;
        case 'notifications':
          await handleNotifications();
          break;
        case 'reminders':
          await handleReminders();
          break;
        case 'priority':
          await handlePriority();
          break;
        case 'export-pdf':
          await handleExportPDF();
          break;
        case 'export-csv':
          await handleExportCSV();
          break;
        case 'share-link':
          await handleShareLink();
          break;
        case 'add-collaborators':
          await handleAddCollaborators();
          break;
        case 'view-activity':
          await handleViewActivity();
          break;
        case 'transfer-ownership':
          await handleTransferOwnership();
          break;
        default:
          alert(`"${option}" functionality is not yet implemented`);
      }
    } catch (error) {
      console.error(`Error executing ${option}:`, error);
      alert(`Failed to execute ${option}. Please try again.`);
    }
  };

  const handleNavigateTo = (destination: string) => {
    console.log('Navigate to:', destination);
    alert(`Navigation to "${destination}" would be implemented here`);
  };

  const handleTaskCreated = (task: any) => {
    console.log('Task created:', task);
    alert(`Task "${task.title}" created successfully!`);
  };

  // Task Management Options Handlers
  const handleDuplicate = async () => {
    // In a real implementation, this would duplicate the selected task/deal
    alert('Duplicate functionality: This would create a copy of the selected item');
  };

  const handleArchive = async () => {
    // In a real implementation, this would archive the selected task/deal
    alert('Archive functionality: This would move the selected item to archive');
  };

  const handleDelete = async () => {
    // In a real implementation, this would delete the selected task/deal with confirmation
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      alert('Delete functionality: This would permanently remove the selected item');
    }
  };

  const handleNotifications = async () => {
    // Simple notification preferences simulation
    const notificationPrefs = {
      email: confirm('Receive email notifications for this funnel?'),
      push: confirm('Receive push notifications for updates?'),
      sms: confirm('Receive SMS notifications for urgent items?'),
      frequency: prompt('Notification frequency? (immediate/daily/weekly)', 'daily')
    };

    alert(`✅ Notification preferences saved!\n\nEmail: ${notificationPrefs.email ? 'Enabled' : 'Disabled'}\nPush: ${notificationPrefs.push ? 'Enabled' : 'Disabled'}\nSMS: ${notificationPrefs.sms ? 'Enabled' : 'Disabled'}\nFrequency: ${notificationPrefs.frequency || 'daily'}`);
  };

  const handleReminders = async () => {
    // Reminder setup simulation
    const reminderType = prompt('What type of reminder? (deadline/followup/custom)', 'deadline');
    const reminderTime = prompt('When to remind? (1hour/1day/1week/custom)', '1day');
    const customMessage = prompt('Custom reminder message (optional):', '');

    const reminderDetails = {
      type: reminderType || 'deadline',
      time: reminderTime || '1day',
      message: customMessage || `Reminder: ${reminderType} for funnel item`,
      created: new Date().toLocaleString()
    };

    alert(`✅ Reminder set successfully!\n\nType: ${reminderDetails.type}\nTime: ${reminderDetails.time}\nMessage: ${reminderDetails.message}\n\nYou will be notified at the specified time.`);
  };

  const handlePriority = async () => {
    // In a real implementation, this would open priority selection
    alert('Priority functionality: This would allow changing the priority level of the selected item');
  };

  const handleExportPDF = async () => {
    try {
      // Create a simple HTML-based PDF content
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Funnel Report - ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .stage-bar { height: 20px; background-color: #e5e5e5; border-radius: 10px; margin: 5px 0; }
                .stage-fill { height: 100%; border-radius: 10px; }
                .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Pipeline Funnel Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>

            <div class="section">
                <h2>Pipeline Overview</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Stage</th>
                            <th>Value</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funnelData.map((stage, index) => {
                          const percentage = (4 - index) * 25;
                          return `
                            <tr>
                                <td>${stage.stage}</td>
                                <td>${stage.value}</td>
                                <td>
                                    <div class="stage-bar">
                                        <div class="stage-fill" style="width: ${percentage}%; background-color: ${stage.color.replace('bg-', '').replace('-600', '')};"></div>
                                    </div>
                                    ${percentage}%
                                </td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>Task Schedule Summary</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Tasks</th>
                            <th>Team Members</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${taskData.map(task => `
                            <tr>
                                <td>${task.day}</td>
                                <td>${task.tasks} tasks</td>
                                <td>${task.assignees.map(a => a.name).join(', ')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>AI Insights</h2>
                <ul>
                    ${aiAlerts.map(alert => `<li>${alert.description}</li>`).join('')}
                </ul>
            </div>

            <div class="footer">
                <p>This report was generated by AI Calendar App</p>
                <p>Confidential - For internal use only</p>
            </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `funnel-report-${new Date().toISOString().split('T')[0]}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ PDF export completed! HTML report downloaded successfully.\n\nNote: In a production app, this would generate a proper PDF file using a library like jsPDF or Puppeteer.');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportCSV = async () => {
    try {
      // Generate CSV data from funnel and task data
      const csvData = [];

      // Add header
      csvData.push(['Stage', 'Value', 'Percentage']);

      // Add funnel data
      funnelData.forEach(stage => {
        const percentage = Math.round((4 - funnelData.indexOf(stage)) * 25);
        csvData.push([stage.stage, stage.value, `${percentage}%`]);
      });

      // Add empty row
      csvData.push([]);

      // Add task data header
      csvData.push(['Day', 'Tasks', 'Assignees']);

      // Add task data
      taskData.forEach(task => {
        const assigneeNames = task.assignees.map(a => a.name).join('; ');
        csvData.push([task.day, task.tasks.toString(), assigneeNames]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `funnel-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ CSV export completed! File downloaded successfully.');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleShareLink = async () => {
    try {
      // Generate a shareable link with current context
      const shareData = {
        type: 'funnel',
        timestamp: Date.now(),
        data: {
          selectedDay,
          funnelData,
          taskData
        }
      };

      // In a real implementation, this would be stored in a database and given a proper ID
      const shareId = btoa(JSON.stringify(shareData)).slice(0, 10);
      const shareLink = `${window.location.origin}/shared/${shareId}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);

      // Show success message
      alert(`✅ Share link copied to clipboard!\n\n${shareLink}\n\nThis link can be shared with team members to view this funnel snapshot.`);
    } catch (error) {
      console.error('Failed to generate share link:', error);
      alert('Failed to generate share link. Please try again.');
    }
  };

  const handleAddCollaborators = async () => {
    // In a real implementation, this would open collaborator management
    alert('Add Collaborators functionality: This would open the collaborator management interface');
  };

  const handleViewActivity = async () => {
    // In a real implementation, this would open activity log
    alert('View Activity Log functionality: This would show the activity history for the selected item');
  };

  const handleTransferOwnership = async () => {
    // In a real implementation, this would open ownership transfer
    alert('Transfer Ownership functionality: This would allow transferring ownership to another user');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Tasks Schedule */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tasks Schedule</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleAddUser}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add User"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={handleMoreOptions}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={handleNavigate}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Navigate"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-2xl font-bold text-gray-900 mb-2">October</h4>
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="font-medium text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {calendarData.map(({ day, assignees }) => (
              <CalendarDay
                key={day}
                day={day}
                isToday={day === today}
                assignees={assignees}
                onClick={() => handleDayClick(day)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {taskData.map((task, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="font-medium text-gray-700">{task.day}</div>
                <TaskAssignees
                  assignees={task.assignees}
                  onClick={handleAssigneeClick}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{task.tasks} tasks</span>
                <button
                  onClick={handleAddTask}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-blue-800">October {selectedDay}</h5>
                <button
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  onClick={handleAddTask}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-blue-700">
                {calendarData[selectedDay - 1].assignees.length > 0
                  ? `${calendarData[selectedDay - 1].assignees.length} assignees with scheduled tasks`
                  : 'No tasks scheduled for this day'}
              </p>
              {calendarData[selectedDay - 1].assignees.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <TaskAssignees
                    assignees={calendarData[selectedDay - 1].assignees}
                    maxVisible={5}
                    onClick={handleAssigneeClick}
                  />
                </div>
              )}
            </div>

            {/* AI Meeting Optimization */}
            {calendarData[selectedDay - 1].assignees.length > 1 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-purple-900 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Meeting Optimization
                  </h5>
                  {isLoadingMeetingAI && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  )}
                </div>

                {/* Optimal Meeting Times */}
                {meetingSuggestions.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Suggested Meeting Times:
                    </h6>
                    <div className="space-y-1">
                      {meetingSuggestions.slice(0, 3).map((time, index) => (
                        <div key={index} className="text-xs text-purple-700 bg-white/50 px-2 py-1 rounded">
                          {time.toLocaleDateString()} at {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-Generated Agenda */}
                {suggestedAgenda.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      AI-Generated Agenda:
                    </h6>
                    <div className="space-y-1">
                      {suggestedAgenda.slice(0, 4).map((item, index) => (
                        <div key={index} className="text-xs text-purple-700 bg-white/50 px-2 py-1 rounded">
                          {index + 1}. {item}
                        </div>
                      ))}
                      {suggestedAgenda.length > 4 && (
                        <div className="text-xs text-purple-600 font-medium">
                          +{suggestedAgenda.length - 4} more items...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-3 flex space-x-2">
                  <ModernButton
                    size="sm"
                    variant="outline"
                    onClick={handleScheduleMeeting}
                    className="bg-white/50 border-purple-200 text-purple-700 hover:bg-white/70"
                  >
                    Schedule Meeting
                  </ModernButton>
                  <ModernButton
                    size="sm"
                    variant="ghost"
                    onClick={generateMeetingOptimizations}
                    disabled={isLoadingMeetingAI}
                    className="text-purple-600 hover:bg-white/50"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Refresh AI
                  </ModernButton>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Stage Funnel with AI Enhancement */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            Stage Funnel
            <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={loadAIInsights}
              disabled={isLoadingAI}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh AI Insights"
            >
              {isLoadingAI ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Brain className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleMoreOptions}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={handleNavigate}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Navigate"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {funnelData.map((stage, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                <span className="text-sm font-semibold text-gray-900">{stage.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${stage.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${(4 - index) * 25}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Weighted</span>
            <span className="text-sm font-medium text-gray-700">Total</span>
          </div>
        </div>

        {/* AI Pipeline Insights */}
        {aiAlerts.filter(alert => alert.type === 'opportunity').length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-green-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                AI Pipeline Insights
              </h5>
            </div>
            <div className="space-y-2">
              {aiAlerts.filter(alert => alert.type === 'opportunity').slice(0, 2).map((alert, index) => (
                <div key={index} className="text-sm text-green-800">
                  • {alert.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Added Team Overview */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Team Assignments
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={handleAddUser}
                className="p-1 rounded hover:bg-blue-100 text-blue-700"
                title="Add User"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={isLoadingMeetingAI}
                className="p-1 rounded hover:bg-blue-100 text-purple-700 disabled:opacity-50"
                title="Schedule Meeting"
              >
                {isLoadingMeetingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {[...new Map(taskData.flatMap(t => t.assignees).map(a => [a.id, a])).values()].map((assignee) => (
              <div key={assignee.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AvatarWithStatus
                    src={assignee.avatar}
                    alt={assignee.name}
                    size="sm"
                    status={assignee.status as any || 'active'}
                  />
                  <span className="text-sm font-medium text-gray-800">{assignee.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {taskData.filter(t => t.assignees.some(a => a.id === assignee.id)).length} days
                  </span>
                  {meetingSuggestions.length > 0 && (
                    <div title="AI optimized schedule available">
                      <Target className="w-3 h-3 text-purple-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUsersAdded={handleUsersAdded}
        title="Add Team Members to Tasks"
        description="Select team members to assign to tasks and projects"
      />

      <MoreOptionsModal
        isOpen={showMoreOptionsModal}
        onClose={() => setShowMoreOptionsModal(false)}
        onOptionSelected={handleOptionSelected}
        context="task"
        title="Task Management Options"
      />

      <NavigationModal
        isOpen={showNavigationModal}
        onClose={() => setShowNavigationModal(false)}
        onNavigate={handleNavigateTo}
        currentView="tasks"
      />

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

// New component to display assignee avatars
const TaskAssignees: React.FC<{
  assignees: Array<{ id: string; name: string; avatar: string; status?: string }>;
  maxVisible?: number;
  size?: 'sm' | 'md';
  onClick?: (id: string) => void;
}> = ({
  assignees,
  maxVisible = 3,
  size = 'sm',
  onClick
}) => {
  if (!assignees.length) {
    return (
      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
        0
      </div>
    );
  }

  const visibleAssignees = assignees.slice(0, maxVisible);
  const remainingCount = assignees.length - maxVisible;

  return (
    <div className="flex -space-x-2">
      {visibleAssignees.map((assignee) => (
        <div
          key={assignee.id}
          className="relative cursor-pointer hover:z-10 transition-all hover:transform hover:scale-110"
          onClick={() => onClick && onClick(assignee.id)}
          title={assignee.name}
        >
          <AvatarWithStatus
            src={assignee.avatar}
            alt={assignee.name}
            size={size}
            status={assignee.status as any || 'active'}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative z-10 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white shadow-sm">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Calendar day component with avatar support
const CalendarDay: React.FC<{
  day: number;
  isToday?: boolean;
  assignees?: Array<{ id: string; name: string; avatar: string; status?: string }>;
  onClick?: () => void;
}> = ({
  day,
  isToday = false,
  assignees = [],
  onClick
}) => {
  const hasAssignees = assignees.length > 0;

  return (
    <div
      className="p-1 flex flex-col items-center"
      onClick={onClick}
    >
      <div className={`
        ${isToday ? 'bg-blue-500 text-white' : hasAssignees ? 'bg-gray-100' : 'text-gray-600'}
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1
        ${hasAssignees ? 'ring-2 ring-blue-200' : ''}
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}
      `}>
        {day}
      </div>

      {hasAssignees && (
        <div className="flex justify-center -mt-1">
          <TaskAssignees
            assignees={assignees}
            maxVisible={2}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};