import React from 'react';
import { CheckSquare, Calendar, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';

const TaskStats: React.FC = () => {
  const { tasks } = useTaskStore();
  const taskList = Object.values(tasks);

  const stats = {
    total: taskList.length,
    completed: taskList.filter(task => task.completed).length,
    overdue: taskList.filter(task => 
      !task.completed && task.dueDate && task.dueDate < new Date()
    ).length,
    dueToday: taskList.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return task.dueDate >= today && task.dueDate < tomorrow;
    }).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: `${completionRate}% complete`,
    },
    {
      title: 'Due Today',
      value: stats.dueToday,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} dark:bg-opacity-20 p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-500">
                  {index === 1 ? '+12%' : '+5%'}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskStats;