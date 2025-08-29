import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { useTaskStore } from '../store/taskStore';
import { getPriorityColor, getCategoryColor, formatDate } from '../utils';
import ReactMarkdown from 'react-markdown';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  selectedDate?: Date;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId, selectedDate }) => {
  const { tasks, createTask, updateTask, deleteTask, markTaskComplete } = useTaskStore();
  const [isEditing, setIsEditing] = useState(!taskId);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: selectedDate || new Date(),
    priority: 'medium',
    category: 'follow-up',
    completed: false,
  });

  const task = taskId ? tasks[taskId] : null;

  useEffect(() => {
    if (task) {
      setFormData(task);
      setIsEditing(false);
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: selectedDate || new Date(),
        priority: 'medium',
        category: 'follow-up',
        completed: false,
      });
      setIsEditing(true);
    }
  }, [task, selectedDate]);

  const handleSubmit = async () => {
    if (taskId && task) {
      await updateTask(taskId, formData);
    } else {
      await createTask(formData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (taskId && confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      onClose();
    }
  };

  const handleComplete = (completed: boolean) => {
    if (taskId) {
      markTaskComplete(taskId, completed);
      setFormData(prev => ({ ...prev, completed }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {taskId ? (isEditing ? 'Edit Task' : 'Task Details') : 'Create New Task'}
              </h3>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {isEditing ? (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter task title..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your task..."
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate ? new Date(formData.dueDate.getTime() - formData.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dueDate: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Task['category'] }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-8">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.completed || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, completed: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Mark as completed</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : task && (
              <div className="space-y-6">
                {/* Task Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleComplete(e.target.checked)}
                      className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                    />
                    <div>
                      <h4 className={`text-2xl font-bold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority} priority
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Due Date</span>
                      <span className={`font-semibold ${
                        !task.completed && task.dueDate < new Date() 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {task.description && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Description</h5>
                    <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-xl">
                      <ReactMarkdown>{task.description}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(task.createdAt)}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium text-green-600">{formatDate(task.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <div>
              {task && !isEditing && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} className="mr-2" />
                    {taskId ? 'Update Task' : 'Create Task'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Edit Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;