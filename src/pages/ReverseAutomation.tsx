import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { AutomationConfig } from '../components/reverse-address/AutomationConfig';
import { useReverseAutomation } from '../hooks/useReverseAutomation';

export const ReverseAutomation: React.FC = () => {
  const { user } = useAuthStore();
  const { isRunning, pendingCount, startAutomation, stopAutomation } = useReverseAutomation(user?.id || '');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Reverse Address Automation</h1>
        <p className="text-gray-600 mt-2">
          Configure and manage automated reverse address lookups
        </p>
      </motion.div>

      <AutomationConfig
        onStart={startAutomation}
        onStop={stopAutomation}
        isRunning={isRunning}
        pendingCount={pendingCount}
      />
    </div>
  );
};