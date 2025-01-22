declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module 'react' {
    interface CSSProperties {
      WebkitAppRegion?: 'drag' | 'no-drag';
    }
}

interface ElectronAPI {
    // Emulator control
    startEmulator: () => Promise<{ success: boolean; error?: string }>;
    stopEmulator: () => Promise<{ success: boolean; error?: string }>;
    checkEmulatorStatus: () => Promise<{ isRunning: boolean }>;
    
    // Screenshot & Recording
    takeScreenshot: () => Promise<{ success: boolean; error?: string }>;
    startRecording: () => Promise<{ success: boolean; error?: string }>;
    stopRecording: () => Promise<{ success: boolean; error?: string }>;
    getRecordingStatus: () => Promise<{ isRecording: boolean }>;
    
    // Device controls
    goHome: () => Promise<{ success: boolean; error?: string }>;
    goBack: () => Promise<{ success: boolean; error?: string }>;
    rotateDevice: () => Promise<{ 
      success: boolean; 
      orientation: 'portrait' | 'landscape';
      error?: string;
    }>;
    checkPlatform: () => Promise<{ isIos: boolean }>;
    
    // Scale control
    setEmulatorScale: (scale: number) => Promise<void>;
    getCurrentScale: () => Promise<number>;
    
    // Mouse events
    setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
    setWindowDraggable: (isDraggable: boolean) => void;
    
    // APK Management
    getAppInfo: () => Promise<{ 
      success: boolean; 
      appInfo?: { 
        version: string; 
        lastUpdated: string; 
      }; 
    }>;
    installCurrentApp: () => Promise<{ success: boolean; error?: string }>;
    
    // Event listeners
    onAppUpdated: (callback: () => void) => void;
    onScaleChanged: (callback: (event: any, scale: number) => void) => void;
}

interface Window {
    electronAPI: ElectronAPI;
}

export {};