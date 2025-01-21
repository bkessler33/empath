import { contextBridge, ipcRenderer } from 'electron';

// Type definitions
declare global {
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
}

// API Implementation
const api: ElectronAPI = {
    startEmulator: () => ipcRenderer.invoke('start-emulator'),
    stopEmulator: () => ipcRenderer.invoke('stop-emulator'),
    checkEmulatorStatus: () => ipcRenderer.invoke('check-emulator-status'),
    takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    getRecordingStatus: () => ipcRenderer.invoke('get-recording-status'),
    goHome: () => ipcRenderer.invoke('device:goHome'),
    goBack: () => ipcRenderer.invoke('device:goBack'),
    rotateDevice: () => ipcRenderer.invoke('device:rotate'),
    checkPlatform: () => ipcRenderer.invoke('device:checkPlatform'),
    setEmulatorScale: (scale) => ipcRenderer.invoke('set-emulator-scale', scale),
    getCurrentScale: () => ipcRenderer.invoke('get-emulator-scale'),
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    installCurrentApp: () => ipcRenderer.invoke('install-current-app'),
    onAppUpdated: (callback) => ipcRenderer.on('app-updated', () => callback()),
    onScaleChanged: (callback) => ipcRenderer.on('scale-changed', callback),
    setIgnoreMouseEvents: (ignore, options) => 
      ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    setWindowDraggable: (isDraggable) => 
      ipcRenderer.send('set-window-draggable', isDraggable),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

export {};