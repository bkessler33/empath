// src/renderer/hooks/useEmulator.ts

import { useState, useEffect } from 'react';

declare global {
  interface ElectronAPI {
    checkEmulatorStatus: () => Promise<{ isRunning: boolean }>;
    startEmulator: () => Promise<{ success: boolean; error?: string }>;
    stopEmulator: () => Promise<{ success: boolean; error?: string }>;
    rotateDevice: () => Promise<{ 
      success: boolean; 
      orientation: 'portrait' | 'landscape';  // Changed from optional to required
      error?: string;
    }>;
  }
}

export const useEmulator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEmulatorStatus();
  }, []);

  const checkEmulatorStatus = async () => {
    try {
      const result = await window.electronAPI.checkEmulatorStatus();
      setIsRunning(result.isRunning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check emulator status');
    }
  };

  const startEmulator = async () => {
    try {
      setError(null);
      const result = await window.electronAPI.startEmulator();
      if (result.success) {
        setIsRunning(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start emulator');
    }
  };

  const stopEmulator = async () => {
    try {
      setError(null);
      const result = await window.electronAPI.stopEmulator();
      if (result.success) {
        setIsRunning(false);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop emulator');
    }
  };

  const rotateDevice = async () => {
    try {
      setError(null);
      const result = await window.electronAPI.rotateDevice();
      if (result.success) {
        setOrientation(result.orientation);
      }
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to rotate device';
      setError(error);
      return { 
        success: false, 
        orientation: orientation, // Include current orientation in error case
        error 
      };
    }
  };

  return {
    isRunning,
    orientation,
    error,
    startEmulator,
    stopEmulator,
    rotateDevice
  };
}