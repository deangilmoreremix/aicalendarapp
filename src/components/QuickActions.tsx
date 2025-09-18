import React, { useState } from 'react';
import { GlassCard } from './ui/GlassCard';
import { MeetingSchedulerModal } from './ui/MeetingSchedulerModal';
import { EmailComposerModal } from './ui/EmailComposerModal';
import { Plus, UserPlus, Calendar, Mail, Bot, Users } from 'lucide-react';

interface QuickActionsProps {
  onNewContact: () => void;
  onContactsView: () => void;
  onNewDeal?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNewContact, onContactsView, onNewDeal }) => {
  const [showMeetingSchedulerModal, setShowMeetingSchedulerModal] = useState(false);
  const [showEmailComposerModal, setShowEmailComposerModal] = useState(false);

  const actions = [
    {
      title: 'New Deal',
      description: 'Create a new sales opportunity',
      icon: Plus,
      color: 'bg-blue-500',
      onClick: onNewDeal || (() => {})
    },
    {
      title: 'New Contact',
      description: 'Add a new contact to CRM',
      icon: UserPlus,
      color: 'bg-green-500',
      onClick: onNewContact
    },
    {
      title: 'Schedule Meeting',
      description: 'AI-powered meeting agenda',
      icon: Calendar,
      color: 'bg-purple-500',
      onClick: () => setShowMeetingSchedulerModal(true)
    },
    {
      title: 'Send Email',
      description: 'AI email composer tool',
      icon: Mail,
      color: 'bg-yellow-500',
      onClick: () => setShowEmailComposerModal(true)
    }
  ];

  const handleDealCreated = (deal: any) => {
    console.log('Deal created:', deal);
    // In a real app, this would update the deals store
    alert(`Deal "${deal.title}" created successfully!`);
  };

  const handleMeetingScheduled = (meeting: any) => {
    console.log('Meeting scheduled:', meeting);
    alert(`Meeting "${meeting.title}" scheduled successfully!`);
  };

  const handleEmailSent = (email: any) => {
    console.log('Email sent:', email);
    alert(`Email "${email.subject}" sent successfully!`);
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          {onContactsView && (
            <button
              onClick={onContactsView}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>View All Contacts</span>
            </button>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-left hover:shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  <div className={`${action.color} p-3 rounded-lg w-fit mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meeting Scheduler Modal */}
      <MeetingSchedulerModal
        isOpen={showMeetingSchedulerModal}
        onClose={() => setShowMeetingSchedulerModal(false)}
        onMeetingScheduled={handleMeetingScheduled}
      />

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={showEmailComposerModal}
        onClose={() => setShowEmailComposerModal(false)}
        onEmailSent={handleEmailSent}
      />
    </>
  );
};