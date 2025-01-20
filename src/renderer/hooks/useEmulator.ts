import { useState, useEffect, useCallback } from 'react';

export const useEmulator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const result = await window.electronAPI.checkEmulatorStatus();
      setIsRunning(result.isRunning);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check emulator status');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const startEmulator = async () => {
    try {
      const result = await window.electronAPI.startEmulator();
      if (result.success) {
        setIsRunning(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to start emulator');
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start emulator');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const stopEmulator = async () => {
    try {
      const result = await window.electronAPI.stopEmulator();
      if (result.success) {
        setIsRunning(false);
        setError(null);
      } else {
        setError(result.error || 'Failed to stop emulator');
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop emulator');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const rotateDevice = async () => {
    try {
      const result = await window.electronAPI.rotateDevice();
      if (result.success) {
        setOrientation(result.orientation);
        setError(null);
      } else {
        setError(result.error || 'Failed to rotate device');
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate device');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    isRunning,
    isRecording,
    orientation,
    error,
    startEmulator,
    stopEmulator,
    rotateDevice,
    checkStatus,
  };
};