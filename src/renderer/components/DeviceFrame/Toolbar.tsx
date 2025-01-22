import React from 'react';
import { Home, ArrowLeft, RotateCcw, Camera, Circle, Share2 } from 'lucide-react';

interface DeviceToolbarProps {
  deviceName: string;
  osVersion: string;
  isRunning: boolean;
  orientation: 'portrait' | 'landscape';
  onRotate: () => Promise<{ success: boolean; orientation: 'portrait' | 'landscape'; error?: string; }>;
  onGoHome: () => Promise<{ success: boolean; error?: string }>;
  onGoBack: () => Promise<{ success: boolean; error?: string }>;
  onTakeScreenshot: () => Promise<{ success: boolean; error?: string }>;
}

export const DeviceToolbar: React.FC<DeviceToolbarProps> = ({
  deviceName,
  osVersion,
  isRunning,
  orientation,
  onRotate,
  onGoHome,
  onGoBack,
  onTakeScreenshot
}) => {
  console.log('Toolbar rendered, isRunning:', isRunning);

  return (
    <div 
      onClick={() => console.log('Outer div clicked')}
      className="absolute inset-0 flex items-center bg-[#2D2D2D]/80 backdrop-blur-xl"
    >
      {/* Left side wrapper - make the entire left side draggable */}
      <div className="flex-grow flex items-center window-draggable">
        {/* Spacer for traffic lights */}
        <div className="w-[70px]" />
        
        {/* Device Info */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{deviceName}</span>
          <span className="text-xs text-gray-400">{osVersion}</span>
        </div>
      </div>
      
      {/* Controls - no draggable class */}
      <div className="flex items-center space-x-1.5 px-3">
        <button 
          onClick={() => {
            console.log('Home clicked');
            onGoHome();
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <Home size={16} />
        </button>

        <button 
          onClick={() => {
            console.log('Back clicked');
            onGoBack();
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <ArrowLeft size={16} />
        </button>

        <button 
          onClick={() => {
            console.log('Rotate clicked');
            onRotate();
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <RotateCcw size={16} />
        </button>

        <button 
          onClick={() => {
            console.log('Screenshot clicked');
            onTakeScreenshot();
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <Camera size={16} />
        </button>

        <button 
          onClick={() => {
            console.log('Record clicked');
            // Recording functionality to be implemented
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <Circle size={16} className="text-red-500" />
        </button>

        <button 
          onClick={() => {
            console.log('Share clicked');
            // Share functionality to be implemented
          }}
          className="p-1.5 text-white hover:bg-white/10 rounded-md"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default DeviceToolbar;