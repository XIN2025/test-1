import React, { useEffect } from 'react';
import { useHealthDataBackgroundSync } from '../hooks/useHealthDataBackgroundSync';

export const HeadlessBackgroundSync: React.FC = () => {
  const { initializeBackgroundSync, syncStatus } = useHealthDataBackgroundSync();

  useEffect(() => {
    if (!syncStatus.isRegistered) {
      initializeBackgroundSync();
    }
  }, [syncStatus.isRegistered, initializeBackgroundSync]);

  return null;
};

export default HeadlessBackgroundSync;
