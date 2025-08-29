import React, { useState } from 'react';
import { Task } from '../types';
import { useTaskStore } from '../store/taskStore';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getPriorityColor, getCategoryColor } from '../utils';

interface TaskCalendarProps {
  onTaskSelect: (task: Task) => void;
  onDateSelect?: (date: Date) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ onTaskSelect, onDateSelect }) => {
  const { tasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

  const calendarDays = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getTasksForDate = (date: Date): Task[] => {
    return Object.values(tasks).filter(task => {
      if (!task.dueDate) return false;
      return (
        task.dueDate.getDate() === date.getDate() &&
        task.dueDate.getMonth() === date.getMonth() &&
        task.dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {daysOfWeek.map(day => (
          <div key={day} className="p-4 text-center font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const tasksForDate = getTasksForDate(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 transition-colors relative group
                ${isCurrentMonthDate ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                ${isTodayDate ? 'ring-2 ring-blue-500 ring-inset' : ''}
              `}
              onClick={() => onDateSelect && onDateSelect(date)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-semibold
                    ${isTodayDate ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
                  `}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonthDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect && onDateSelect(date);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Task Pills */}
              <div className="space-y-1 max-h-20 overflow-hidden">
                {tasksForDate.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskSelect(task);
                    }}
                    className={`text-xs p-1.5 rounded-md cursor-pointer truncate transition-all hover:shadow-sm border
                      ${task.completed ? 'line-through opacity-60' : ''}
                      ${getPriorityColor(task.priority)}
                    `}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {tasksForDate.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{tasksForDate.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCalendar;