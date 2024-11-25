import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { Copy, Check, Bell, Lock, Mail, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    updates: true,
    security: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setTwoFactorEnabled(user.twoFactorEnabled || false);
      if (user.notificationPreferences) {
        setNotifications(user.notificationPreferences);
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      if (password && !currentPassword) {
        throw new Error('Current password is required to set a new password');
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
        });

        if (passwordError) throw passwordError;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          two_factor_enabled: twoFactorEnabled,
          notification_preferences: notifications,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setPassword('');
      setCurrentPassword('');
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const copyPixelCode = async () => {
    if (!user?.id) return;

    const pixelCode = `<script src="${window.location.origin}/tracker.js" data-user-id="${user.id}" async></script>`;

    try {
      await navigator.clipboard.writeText(pixelCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold">Profile Settings</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {message && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter current password to change"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="two-factor"
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="two-factor"
                className="ml-2 block text-sm text-gray-900"
              >
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Notification Preferences
            </h3>
            <div className="space-y-2">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    id={`notification-${key}`}
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [key]: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
          </div>
        </form>
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
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
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
            {`<script src="${window.location.origin}/tracker.js" data-user-id="${user?.id}" async></script>`}
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
