interface ElectronAPI {
    startEmulator: () => Promise<{ success: boolean; error?: string }>;
    stopEmulator: () => Promise<{ success: boolean; error?: string }>;
    checkEmulatorStatus: () => Promise<{ isRunning: boolean }>;
    takeScreenshot: () => Promise<{ success: boolean; error?: string }>;
    startRecording: () => Promise<{ success: boolean; error?: string }>;
    stopRecording: () => Promise<{ success: boolean; error?: string }>;
    getRecordingStatus: () => Promise<{ isRecording: boolean }>;
    goHome: () => Promise<{ success: boolean; error?: string }>;
    goBack: () => Promise<{ success: boolean; error?: string }>;
    rotateDevice: () => Promise<{ success: boolean; orientation: 'portrait' | 'landscape'; error?: string }>;
    checkPlatform: () => Promise<{ isIos: boolean }>;
    getAppInfo: () => Promise<{ success: boolean; appInfo?: { version: string; lastUpdated: string } }>;
    onAppUpdated: (callback: () => void) => void;
  }
  
  interface Window {
    electronAPI: ElectronAPI;
  }