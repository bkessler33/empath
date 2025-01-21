//Toolbar.tsx
import React from 'react';
import { Home, ArrowLeft, RotateCcw, Camera, Circle, Share2 } from 'lucide-react';

interface DeviceToolbarProps {
  deviceName: string;
  osVersion: string;
  isRunning: boolean;
  orientation: 'portrait' | 'landscape';
  onRotate: () => Promise<{ 
    success: boolean; 
    orientation: 'portrait' | 'landscape'; 
    error?: string; 
  }>;
}

export const DeviceToolbar: React.FC<DeviceToolbarProps> = ({
  deviceName,
  osVersion,
  isRunning,
  orientation,
  onRotate
}) => {
  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#2D2D2D]/80 backdrop-blur-xl window-draggable prevent-select">
      <div className="h-full w-full flex items-center px-3">
        {/* Spacer for traffic lights */}
        <div className="w-[70px]" />
        
        {/* Device Info */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{deviceName}</span>
          <span className="text-xs text-gray-400">{osVersion}</span>
        </div>
        
        {/* Spacer to push controls to right */}
        <div className="flex-grow" />
        
        {/* Controls */}
        <div className="flex items-center space-x-1.5 window-no-drag text-white">
          <button 
            disabled={!isRunning} 
            onClick={() => handleAction(window.electronAPI.goHome)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Home"
          >
            <Home size={16} />
          </button>
          <button 
            disabled={!isRunning} 
            onClick={() => handleAction(window.electronAPI.goBack)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            disabled={!isRunning} 
            onClick={() => handleAction(onRotate)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Rotate device"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            disabled={!isRunning} 
            onClick={() => handleAction(window.electronAPI.takeScreenshot)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Take screenshot"
          >
            <Camera size={16} />
          </button>
          <button 
            disabled={!isRunning} 
            onClick={() => handleAction(window.electronAPI.startRecording)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Start recording"
          >
            <Circle size={16} className="text-red-500" />
          </button>
          <button 
            disabled={!isRunning} 
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 
                     transition-colors duration-150 ease-in-out"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceToolbar;