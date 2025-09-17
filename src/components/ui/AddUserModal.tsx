import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { useContactStore } from '../../store/contactStore';
import { Contact } from '../../types';
import {
  X,
  User,
  Search,
  Plus,
  Check,
  Loader2,
  Users,
  Mail,
  Phone
} from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersAdded?: (users: Contact[]) => void;
  preselectedUsers?: string[];
  title?: string;
  description?: string;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUsersAdded,
  preselectedUsers = [],
  title = "Add Team Members",
  description = "Select contacts to add to this task or project"
}) => {
  const { contacts } = useContactStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(preselectedUsers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(preselectedUsers);
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen, preselectedUsers]);

  const contactsArray = Object.values(contacts);

  // Filter contacts based on search term
  const filteredContacts = contactsArray.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (contactId: string) => {
    setSelectedUsers(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredContacts.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredContacts.map(c => c.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      setErrors({ users: 'Please select at least one user' });
      return;
    }

    setIsLoading(true);
    try {
      const selectedContacts = selectedUsers.map(id => contacts[id]).filter(Boolean);
      onUsersAdded?.(selectedContacts);
      onClose();
    } catch (error) {
      console.error('Failed to add users:', error);
      setErrors({ submit: 'Failed to add users. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getContactDisplay = (contact: Contact) => {
    return {
      name: contact.name,
      title: contact.title || 'No title',
      company: contact.company,
      email: contact.email,
      avatar: contact.avatarSrc || contact.avatar
    };
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <DialogTitle>{title}</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
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
              placeholder="Search contacts by name, email, title, or company..."
              className="pl-10"
            />
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} of {filteredContacts.length} contacts selected
              </span>
              {selectedUsers.length > 0 && (
                <Badge variant="secondary">
                  {selectedUsers.length} selected
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Contact List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No contacts found matching your search.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map(contact => {
                  const display = getContactDisplay(contact);
                  const isSelected = selectedUsers.includes(contact.id);

                  return (
                    <div
                      key={contact.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleUserToggle(contact.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Checkbox */}
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {display.avatar ? (
                            <img
                              src={display.avatar}
                              alt={display.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {display.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {display.name}
                            </h4>
                            {isSelected && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {display.title} at {display.company}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Mail size={12} />
                              <span className="truncate">{display.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Messages */}
          {errors.users && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.users}</p>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                Selected Team Members ({selectedUsers.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const contact = contacts[userId];
                  if (!contact) return null;

                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                      <User size={12} />
                      {contact.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserToggle(userId);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedUsers.length === 0}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>
                {isLoading ? 'Adding...' : `Add ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};