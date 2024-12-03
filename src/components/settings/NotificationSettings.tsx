import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationSettingsProps {
  settings: {
    email: boolean;
    browser: boolean;
    updates: boolean;
    security: boolean;
  };
  onChange: (settings: any) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-green-700" />
        <h3 className="text-sm font-medium text-gray-700">Notification Preferences</h3>
      </div>
      <div className="space-y-2">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <input
              id={`notification-${key}`}
              type="checkbox"
              checked={value}
              onChange={(e) =>
                onChange({
                  ...settings,
                  [key]: e.target.checked,
                })
              }
              className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
            />
            <label
              htmlFor={`notification-${key}`}
              className="ml-2 block text-sm text-gray-900 capitalize"
            >
              {key} Notifications
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};