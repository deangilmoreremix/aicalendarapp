/**
 * Example Host Application Integration
 *
 * This file demonstrates how to consume the CalendarApp module federation remote
 * in a host application.
 */

import React, { lazy, Suspense } from 'react';

// Lazy load remote modules from CalendarApp
const CalendarApp = lazy(() => import('CalendarApp/CalendarApp'));
const CalendarModule = lazy(() => import('CalendarApp/CalendarModule'));
const BigTaskCalendar = lazy(() => import('CalendarApp/BigTaskCalendar'));
const ContactsModal = lazy(() => import('CalendarApp/ContactsModal'));
const TasksAndFunnel = lazy(() => import('CalendarApp/TasksAndFunnel'));
const CustomerProfile = lazy(() => import('CalendarApp/CustomerProfile'));

// Example 1: Full Calendar App Integration
export const FullCalendarAppExample: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Calendar App...</div>}>
        <CalendarApp />
      </Suspense>
    </div>
  );
};

// Example 2: Calendar Module with Different Modes
export const CalendarModuleExample: React.FC = () => {
  const [mode, setMode] = React.useState<'calendar' | 'tasks' | 'contacts' | 'profile'>('calendar');

  return (
    <div className="w-full h-screen">
      {/* Mode selector */}
      <div className="flex gap-2 p-4 border-b">
        <button
          onClick={() => setMode('calendar')}
          className={`px-4 py-2 rounded ${mode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setMode('tasks')}
          className={`px-4 py-2 rounded ${mode === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Tasks
        </button>
        <button
          onClick={() => setMode('contacts')}
          className={`px-4 py-2 rounded ${mode === 'contacts' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Contacts
        </button>
        <button
          onClick={() => setMode('profile')}
          className={`px-4 py-2 rounded ${mode === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Profile
        </button>
      </div>

      {/* Calendar module */}
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <CalendarModule mode={mode} />
      </Suspense>
    </div>
  );
};

// Example 3: Individual Component Integration
export const IndividualComponentsExample: React.FC = () => {
  const [showContacts, setShowContacts] = React.useState(false);

  return (
    <div className="w-full min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">CRM Dashboard</h1>

      {/* Task Calendar */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Calendar View</h2>
        <Suspense fallback={<div>Loading calendar...</div>}>
          <BigTaskCalendar />
        </Suspense>
      </section>

      {/* Tasks and Funnel */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Tasks & Pipeline</h2>
        <Suspense fallback={<div>Loading tasks...</div>}>
          <TasksAndFunnel />
        </Suspense>
      </section>

      {/* Customer Profile */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Customer Profile</h2>
        <Suspense fallback={<div>Loading profile...</div>}>
          <CustomerProfile />
        </Suspense>
      </section>

      {/* Contacts Modal (triggered by button) */}
      <section>
        <button
          onClick={() => setShowContacts(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open Contacts
        </button>

        {showContacts && (
          <Suspense fallback={<div>Loading contacts...</div>}>
            <ContactsModal
              isOpen={showContacts}
              onClose={() => setShowContacts(false)}
            />
          </Suspense>
        )}
      </section>
    </div>
  );
};

// Example 4: Embedded Calendar Widget
export const EmbeddedCalendarWidget: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>
        <Suspense fallback={<div>Loading calendar widget...</div>}>
          <CalendarModule mode="calendar" />
        </Suspense>
      </div>
    </div>
  );
};

// Example 5: Multiple Instances with Different Data
export const MultiInstanceExample: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {/* Sales Calendar */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Sales Team Calendar</h3>
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarModule mode="tasks" />
        </Suspense>
      </div>

      {/* Marketing Calendar */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Marketing Team Calendar</h3>
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarModule mode="tasks" />
        </Suspense>
      </div>
    </div>
  );
};

// Example 6: Responsive Integration with Tabs
export const ResponsiveTabExample: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'calendar' | 'tasks' | 'contacts'>('calendar');

  return (
    <div className="w-full min-h-screen">
      {/* Tab Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contacts
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<div>Loading...</div>}>
          {activeTab === 'calendar' && <BigTaskCalendar />}
          {activeTab === 'tasks' && <TasksAndFunnel />}
          {activeTab === 'contacts' && <CalendarModule mode="contacts" />}
        </Suspense>
      </div>
    </div>
  );
};

// Example 7: Error Boundary Integration
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CalendarApp Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold mb-2">Failed to load Calendar App</h2>
          <p className="text-red-600 text-sm">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SafeCalendarIntegration: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading Calendar App...</div>}>
        <CalendarApp />
      </Suspense>
    </ErrorBoundary>
  );
};

// Default export with all examples
export default {
  FullCalendarAppExample,
  CalendarModuleExample,
  IndividualComponentsExample,
  EmbeddedCalendarWidget,
  MultiInstanceExample,
  ResponsiveTabExample,
  SafeCalendarIntegration,
};
