import React, { useState } from 'react';
import { ModernButton } from './ModernButton';
import { MockDataService, MockDataStats } from '../../services/mockDataService';
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface DeleteMockDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDeleted?: (stats: MockDataStats) => void;
}

export const DeleteMockDataDialog: React.FC<DeleteMockDataDialogProps> = ({
  isOpen,
  onClose,
  onDataDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deletedStats, setDeletedStats] = useState<MockDataStats | null>(null);

  if (!isOpen) return null;

  const stats = MockDataService.getMockDataStats();
  const hasData = MockDataService.hasMockData();
  const deletionSummary = MockDataService.getDeletionSummary();

  const handleDeleteAll = async () => {
    if (!hasData) return;

    setIsDeleting(true);
    try {
      const deletedDataStats = await MockDataService.clearAllMockData();
      setDeletedStats(deletedDataStats);
      setIsSuccess(true);
      onDataDeleted?.(deletedDataStats);

      // Auto-close after showing success for 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Failed to delete mock data:', error);
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsDeleting(false);
    setIsSuccess(false);
    setDeletedStats(null);
    onClose();
  };

  if (isSuccess && deletedStats) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">Mock Data Cleared!</h3>
          <p className="text-green-700 mb-4">
            Successfully deleted {deletedStats.total} items from your app.
          </p>
          <div className="text-sm text-gray-600 space-y-1 mb-6">
            {deletedStats.tasks > 0 && <p>• {deletedStats.tasks} tasks</p>}
            {deletedStats.calendarEvents > 0 && <p>• {deletedStats.calendarEvents} calendar events</p>}
            {deletedStats.activities > 0 && <p>• {deletedStats.activities} activities</p>}
            {deletedStats.appointments > 0 && <p>• {deletedStats.appointments} appointments</p>}
            {deletedStats.contacts > 0 && <p>• {deletedStats.contacts} contacts</p>}
            {deletedStats.deals > 0 && <p>• {deletedStats.deals} deals</p>}
          </div>
          <ModernButton variant="primary" onClick={handleClose}>
            Close
          </ModernButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete All Mock Data</h2>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasData ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Mock Data Found</h3>
              <p className="text-gray-600">
                Your app is already clean! No mock data to delete.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  This will permanently delete all demo/mock data from your application. This includes:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {stats.tasks > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tasks:</span>
                      <span className="font-medium">{stats.tasks}</span>
                    </div>
                  )}
                  {stats.calendarEvents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Calendar Events:</span>
                      <span className="font-medium">{stats.calendarEvents}</span>
                    </div>
                  )}
                  {stats.activities > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Activities:</span>
                      <span className="font-medium">{stats.activities}</span>
                    </div>
                  )}
                  {stats.appointments > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Appointments:</span>
                      <span className="font-medium">{stats.appointments}</span>
                    </div>
                  )}
                  {stats.contacts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Contacts:</span>
                      <span className="font-medium">{stats.contacts}</span>
                    </div>
                  )}
                  {stats.deals > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Deals:</span>
                      <span className="font-medium">{stats.deals}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Items:</span>
                      <span>{stats.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-1">Warning</h4>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. All demo data will be permanently removed from your application.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Ready to start fresh with your own data?
          </div>

          <div className="flex items-center space-x-3">
            <ModernButton
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </ModernButton>

            {hasData && (
              <ModernButton
                variant="danger"
                onClick={handleDeleteAll}
                loading={isDeleting}
                className="flex items-center space-x-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Data</span>
                  </>
                )}
              </ModernButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};