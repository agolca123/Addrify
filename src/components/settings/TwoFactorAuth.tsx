import React, { useState } from 'react';
import { Shield, Smartphone, QrCode } from 'lucide-react';
import { supabase } from '../../config/supabase';

interface TwoFactorAuthProps {
  enabled: boolean;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ enabled, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');

  const handleToggle2FA = async () => {
    setLoading(true);

    try {
      if (!enabled) {
        // Start 2FA setup
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp'
        });

        if (error) throw error;
        if (!data?.id || !data.totp) {
          throw new Error('Failed to initialize 2FA');
        }

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setShowSetup(true);
      } else {
        // Disable 2FA
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp ? factors.totp[0] : null;

        if (totpFactor) {
          const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
          if (error) throw error;
        }

        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setShowSetup(false);
      setVerificationCode('');
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to verify 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-700" />
          <span className="text-sm font-medium text-gray-900">Two-Factor Authentication</span>
        </div>
        <button
          onClick={handleToggle2FA}
          disabled={loading || showSetup}
          className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
        >
          {enabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      </div>

      {showSetup && (
        <div className="mt-4 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Set up Two-Factor Authentication</h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Smartphone className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">1. Install an authenticator app</p>
                  <p className="text-sm text-gray-600">
                    Download and install an authenticator app like Google Authenticator or Authy on your phone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <QrCode className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">2. Scan QR code</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Open your authenticator app and scan this QR code:
                  </p>
                  {qrCode && (
                    <div className="bg-white p-4 inline-block rounded-lg shadow-sm">
                      <img src={qrCode} alt="2FA QR Code" className="max-w-[200px]" />
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Can't scan? Manual entry code: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                    3. Enter verification code
                  </label>
                  <input
                    type="text"
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    pattern="[0-9]{6}"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-600 focus:border-green-600"
                    placeholder="Enter 6-digit code"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};