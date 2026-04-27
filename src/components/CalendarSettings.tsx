import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface CalendarAccount {
  id: string;
  provider: 'google' | 'microsoft';
  email: string;
  connected: boolean;
  lastSync?: Date;
}

export const CalendarSettings: React.FC = () => {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([
    {
      id: '1',
      provider: 'google',
      email: 'user@gmail.com',
      connected: false,
    },
    {
      id: '2',
      provider: 'microsoft',
      email: 'user@outlook.com',
      connected: false,
    }
  ]);

  const handleConnect = async (account: CalendarAccount) => {
    // TODO: Implement OAuth flow
    if (account.provider === 'google') {
      // Google OAuth
      console.log('Connecting to Google Calendar');
    } else {
      // Microsoft OAuth
      console.log('Connecting to Microsoft Calendar');
    }

    // Mock connection
    setAccounts(prev => prev.map(acc =>
      acc.id === account.id
        ? { ...acc, connected: true, lastSync: new Date() }
        : acc
    ));
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId
        ? { ...acc, connected: false, lastSync: undefined }
        : acc
    ));
  };

  const handleSync = async (account: CalendarAccount) => {
    // TODO: Implement sync
    console.log('Syncing calendar for', account.email);
    setAccounts(prev => prev.map(acc =>
      acc.id === account.id
        ? { ...acc, lastSync: new Date() }
        : acc
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Calendar Settings
        </h2>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    account.provider === 'google' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {account.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {account.email}
                    </p>
                    {account.lastSync && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Last synced: {account.lastSync.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`${
                      account.connected
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {account.connected ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {account.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account)}
                      >
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(account)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-sync</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically sync calendar events every hour
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-way Sync</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sync changes both ways between app and external calendar
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};