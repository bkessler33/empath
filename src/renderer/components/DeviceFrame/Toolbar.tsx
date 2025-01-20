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
    } | { 
      success: boolean; 
      error: string; 
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
    <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-2 rounded-t-[40px] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{deviceName}</span>
        <span className="text-xs text-gray-400">{osVersion}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          disabled={!isRunning} 
          onClick={() => handleAction(window.electronAPI.goHome)}
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <Home size={16} />
        </button>
        <button 
          disabled={!isRunning} 
          onClick={() => handleAction(window.electronAPI.goBack)}
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <ArrowLeft size={16} />
        </button>
        <button 
          disabled={!isRunning} 
          onClick={() => handleAction(onRotate)}
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <RotateCcw size={16} />
        </button>
        <button 
          disabled={!isRunning} 
          onClick={() => handleAction(window.electronAPI.takeScreenshot)}
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <Camera size={16} />
        </button>
        <button 
          disabled={!isRunning} 
          onClick={() => handleAction(window.electronAPI.startRecording)}
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <Circle size={16} />
        </button>
        <button 
          disabled={!isRunning} 
          className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};