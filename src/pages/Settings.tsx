import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { Mail, Shield, Copy, Check } from 'lucide-react';
import { PasswordChange } from '../components/settings/PasswordChange';
import { TwoFactorAuth } from '../components/settings/TwoFactorAuth';
import { NotificationSettings } from '../components/settings/NotificationSettings';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    updates: true,
    security: true,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotifications(user.notificationPreferences);
    }
  }, [user]);

  const handleSuccess = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleError = (err: string) => {
    setError(err);
    setMessage('');
  };

  const handleNotificationChange = async (newSettings: any) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          notification_preferences: newSettings,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      setNotifications(newSettings);
      handleSuccess('Notification preferences updated');
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Failed to update notification preferences');
    }
  };

  const copyPixelCode = async () => {
    if (!user?.id) return;

    const pixelCode = `<script>
    var script = document.createElement('script');
    script.src = "${window.location.origin}/tracker.js";
    script.async = true;
    script.setAttribute('data-user-id', '${user.id}');
    document.head.appendChild(script);
  </script>`;

    try {
      await navigator.clipboard.writeText(pixelCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-green-700" />
          <h2 className="text-xl font-bold">Profile Settings</h2>
        </div>

        {message && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Email Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={user.email}
                disabled
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Password Change */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <PasswordChange
              onSuccess={() => handleSuccess('Password updated successfully')}
              onError={handleError}
            />
          </div>

          {/* Two-Factor Authentication */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
            <TwoFactorAuth
              enabled={user.twoFactorEnabled}
              onSuccess={() => handleSuccess('2FA settings updated successfully')}
              onError={handleError}
            />
          </div>

          {/* Notification Settings */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Notifications</h3>
            <NotificationSettings
              settings={notifications}
              onChange={handleNotificationChange}
            />
          </div>
        </div>
      </motion.div>

      {/* Tracking Pixel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Tracking Pixel</h3>
          <button
            onClick={copyPixelCode}
            className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
              copied
                ? 'bg-green-700 hover:bg-green-600'
                : 'bg-green-700 hover:bg-green-600'
            } text-white`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
          {`<script> var script = document.createElement('script'); script.src = "${window.location.origin}/tracker.js"; script.async = true; script.setAttribute('data-user-id', '${user?.id}'); document.head.appendChild(script); </script> `}
          </pre>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal ml-4 space-y-2">
            <li>Copy the code above</li>
            <li>
              Paste it just before the closing <code>&lt;/body&gt;</code> tag of
              your website
            </li>
            <li>
              When visitors access your site, they'll see a location permission
              prompt
            </li>
            <li>
              After allowing access, their location data will appear in your
              dashboard
            </li>
          </ol>
        </div>
      </motion.div>

      {/* Account Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-semibold mb-4">Account Status</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Subscription Plan</p>
              <p className="text-sm text-gray-500">
                {user?.subscriptionStatus || 'Free'}
              </p>
            </div>
            {user?.subscriptionStatus === 'free' && (
              <button
                onClick={() => (window.location.href = '/subscription')}
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
              >
                Upgrade Plan
              </button>
            )}
          </div>
          {user?.subscriptionEndDate && (
            <div>
              <p className="font-medium">Subscription Ends</p>
              <p className="text-sm text-gray-500">
                {new Date(user.subscriptionEndDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="font-medium">Account Created</p>
            <p className="text-sm text-gray-500">
              {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};