import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Emulator control
    startEmulator: () => ipcRenderer.invoke('start-emulator'),
    stopEmulator: () => ipcRenderer.invoke('stop-emulator'),
    checkEmulatorStatus: () => ipcRenderer.invoke('check-emulator-status'),
    
    // Screenshot & Recording
    takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    getRecordingStatus: () => ipcRenderer.invoke('get-recording-status'),

    // Device controls
    goHome: () => ipcRenderer.invoke('device:goHome'),
    goBack: () => ipcRenderer.invoke('device:goBack'),
    rotateDevice: () => ipcRenderer.invoke('device:rotate'),
    checkPlatform: () => ipcRenderer.invoke('device:checkPlatform'),

    // Scale control
    setEmulatorScale: (scale: number) => ipcRenderer.invoke('set-emulator-scale', scale),
    getCurrentScale: () => ipcRenderer.invoke('get-emulator-scale'),

    // APK Management
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    installCurrentApp: () => ipcRenderer.invoke('install-current-app'),
    
    // Event listeners
    onAppUpdated: (callback: () => void) => 
        ipcRenderer.on('app-updated', () => callback()),
    onScaleChanged: (callback: (event: any, scale: number) => void) =>
        ipcRenderer.on('scale-changed', callback),
});