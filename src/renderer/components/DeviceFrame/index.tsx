import React from 'react';
import { DeviceToolbar } from './Toolbar';
import { devices } from '../../config/devices';
import { useEmulator } from '../../hooks/useEmulator';

interface DeviceFrameProps {
  device?: typeof devices.pixel7Pro;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ 
  device = devices.pixel7Pro 
}) => {
  const { 
    isRunning, 
    orientation, 
    error,
    startEmulator,
    stopEmulator,
    rotateDevice 
  } = useEmulator();

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
          {error}
        </div>
      )}
      <div 
        className={`relative bg-black rounded-[40px] transition-all duration-300 ease-in-out shadow-xl`}
        style={{
          width: orientation === 'portrait' ? device.dimensions.width : device.dimensions.height,
          height: orientation === 'portrait' ? device.dimensions.height : device.dimensions.width,
        }}
      >
        <DeviceToolbar 
          deviceName={device.name}
          osVersion={device.os}
          isRunning={isRunning}
          orientation={orientation}
          onRotate={rotateDevice}
        />
        
        {/* Emulator content will go here */}
        <div className="w-full h-full bg-white">
          {!isRunning && (
            <button 
              onClick={startEmulator}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Emulator
            </button>
          )}
        </div>
      </div>
    </div>
  );
};