import React, { useState, useEffect } from 'react';
import { MessageSquare, Save } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { SMSSettings as SMSSettingsType } from '../../types/sms';

interface SMSSettingsProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const SMSSettings: React.FC<SMSSettingsProps> = ({ onSuccess, onError }) => {
  const [settings, setSettings] = useState<Partial<SMSSettingsType>>({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    rate_limit: 1,
    timezone: 'UTC',
    default_auto_reply: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('sms_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save SMS settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-green-700" />
        <h3 className="text-sm font-medium text-gray-700">SMS Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Twilio Account SID
            </label>
            <input
              type="text"
              value={settings.twilio_account_sid || ''}
              onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Twilio Auth Token
            </label>
            <input
              type="password"
              value={settings.twilio_auth_token || ''}
              onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Twilio Phone Number
            </label>
            <input
              type="text"
              value={settings.twilio_phone_number || ''}
              onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
              placeholder="+1234567890"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rate Limit (messages per second)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.rate_limit || 1}
              onChange={(e) => setSettings({ ...settings, rate_limit: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            value={settings.timezone || 'UTC'}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Auto Reply Message
          </label>
          <textarea
            value={settings.default_auto_reply || ''}
            onChange={(e) => setSettings({ ...settings, default_auto_reply: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
            placeholder="Thank you for your message. We'll get back to you soon."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};