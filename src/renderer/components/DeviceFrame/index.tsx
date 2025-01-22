import React, { useEffect } from 'react';
import { DeviceToolbar } from './Toolbar';
import { devices } from '../../config/devices';
import { useEmulator } from '../../hooks/useEmulator';

interface DeviceFrameProps {
  device?: typeof devices.pixel7Pro;
}

const DeviceFrame: React.FC<DeviceFrameProps> = ({ 
  device = devices.pixel7Pro 
}) => {
  console.log('DeviceFrame rendered');  // Add this line

  const { 
    isRunning, 
    orientation, 
    error,
    startEmulator,
    stopEmulator,
    rotateDevice,
    goHome,
    goBack,
    takeScreenshot
  } = useEmulator();

  return (
    <div className="h-full w-full bg-transparent">
      <DeviceToolbar 
        deviceName={device.name}
        osVersion={device.os}
        isRunning={isRunning}
        orientation={orientation}
        onRotate={rotateDevice}
        onGoHome={goHome}
        onGoBack={goBack}
        onTakeScreenshot={takeScreenshot}
      />
      
      {error && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 
                     bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeviceFrame;