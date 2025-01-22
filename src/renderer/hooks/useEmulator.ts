import { useState, useEffect } from 'react';

export const useEmulator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEmulator hook mounted');
    checkEmulatorStatus();
  }, []);

  const checkEmulatorStatus = async () => {
    console.log('Checking emulator status...');
    try {
      const result = await window.electronAPI.checkEmulatorStatus();
      console.log('Emulator status result:', result);
      setIsRunning(result.isRunning);
    } catch (err) {
      console.error('Error checking emulator status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check emulator status');
    }
  };

  const startEmulator = async () => {
    console.log('Starting emulator...');
    try {
      setError(null);
      const result = await window.electronAPI.startEmulator();
      console.log('Start emulator result:', result);
      if (result.success) {
        setIsRunning(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error starting emulator:', err);
      setError(err instanceof Error ? err.message : 'Failed to start emulator');
    }
  };

  const stopEmulator = async () => {
    console.log('Stopping emulator...');
    try {
      setError(null);
      const result = await window.electronAPI.stopEmulator();
      console.log('Stop emulator result:', result);
      if (result.success) {
        setIsRunning(false);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error stopping emulator:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop emulator');
    }
  };

  const rotateDevice = async () => {
    console.log('Rotating device...');
    try {
      setError(null);
      console.log('Calling electronAPI.rotateDevice');
      const result = await window.electronAPI.rotateDevice();
      console.log('Rotate device result:', result);
      if (result.success) {
        setOrientation(result.orientation);
      }
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      console.error('Error rotating device:', err);
      const error = err instanceof Error ? err.message : 'Failed to rotate device';
      setError(error);
      return { 
        success: false, 
        orientation: orientation,
        error 
      };
    }
  };

  const goHome = async () => {
    console.log('Going home...');
    try {
      setError(null);
      console.log('Checking if window.electronAPI exists:', !!window.electronAPI);
      console.log('Checking if goHome method exists:', !!window.electronAPI?.goHome);
      const result = await window.electronAPI.goHome();
      console.log('Go home result:', result);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      console.error('Error going home:', err);
      const error = err instanceof Error ? err.message : 'Failed to go home';
      setError(error);
      return { success: false, error };
    }
  };

  const goBack = async () => {
    console.log('Going back...');
    try {
      setError(null);
      console.log('Checking if window.electronAPI exists:', !!window.electronAPI);
      console.log('Checking if goBack method exists:', !!window.electronAPI?.goBack);
      const result = await window.electronAPI.goBack();
      console.log('Go back result:', result);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      console.error('Error going back:', err);
      const error = err instanceof Error ? err.message : 'Failed to go back';
      setError(error);
      return { success: false, error };
    }
  };

  const takeScreenshot = async () => {
    console.log('Taking screenshot...');
    try {
      setError(null);
      console.log('Checking if window.electronAPI exists:', !!window.electronAPI);
      console.log('Checking if takeScreenshot method exists:', !!window.electronAPI?.takeScreenshot);
      const result = await window.electronAPI.takeScreenshot();
      console.log('Take screenshot result:', result);
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      console.error('Error taking screenshot:', err);
      const error = err instanceof Error ? err.message : 'Failed to take screenshot';
      setError(error);
      return { success: false, error };
    }
  };

  return {
    isRunning,
    orientation,
    error,
    startEmulator,
    stopEmulator,
    rotateDevice,
    goHome,
    goBack,
    takeScreenshot
  };
};