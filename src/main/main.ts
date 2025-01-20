process.env.NAME = "Empath";

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AndroidEmulatorService } from './services/android-emulator';
import { MenuService } from './services/menu';
import { ApkManagerService } from './services/apk-manager';
import { store } from './config/store';

const name = 'Empath';
app.setName(name);

let mainWindow: BrowserWindow;
const emulatorService = new AndroidEmulatorService();
const apkManager = new ApkManagerService(emulatorService);
let menuService: MenuService;

app.name = 'Empath';

function createWindow() {
    console.log('Creating window...');
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Update the HTML path to point to the renderer directory
    const htmlPath = path.join(__dirname, '..', 'renderer', 'index.html');
    console.log('Attempting to load HTML from:', htmlPath);
    
    mainWindow.loadFile(htmlPath).catch(err => {
        console.error('Failed to load HTML:', err);
    });

    // Initialize menu service after window creation with all required services
    menuService = new MenuService(apkManager, mainWindow, emulatorService);

    mainWindow.webContents.openDevTools();  // This will help us debug

    // Log when window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Window loaded successfully');
    });
}

app.whenReady().then(() => {
    console.log('Electron app is ready');
    createWindow();

    // APK Management IPC handlers
    ipcMain.handle('get-app-info', async () => {
        try {
            const appInfo = await apkManager.getCurrentAppInfo();
            return { success: true, appInfo };
        } catch (err) {
            return { 
                success: false, 
                error: err instanceof Error ? err.message : String(err) 
            };
        }
    });

    ipcMain.handle('install-current-app', async () => {
        try {
            const result = await apkManager.installCurrentApk();
            return result;
        } catch (err) {
            return { 
                success: false, 
                error: err instanceof Error ? err.message : String(err) 
            };
        }
    });

    // Existing IPC handlers
    ipcMain.handle('start-emulator', async () => {
        try {
            console.log('Received start-emulator request');
            // Removed: const currentScale = store.get('emulator').scale;
            // Changed to pass undefined instead of currentScale
            const success = await emulatorService.startEmulator();
            return { success };
        } catch (err) {
            console.error('Error starting emulator:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('stop-emulator', async () => {
        try {
            console.log('Received stop-emulator request');
            await emulatorService.stopEmulator();
            return { success: true };
        } catch (err) {
            console.error('Error stopping emulator:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('check-emulator-status', async () => {
        try {
            console.log('Checking emulator status');
            const isRunning = await emulatorService.isEmulatorRunning();
            return { isRunning };
        } catch (err) {
            console.error('Error checking emulator status:', err);
            return { isRunning: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('take-screenshot', async () => {
        try {
            console.log('Received take-screenshot request');
            const result = await emulatorService.takeScreenshot();
            return result;
        } catch (err) {
            console.error('Error taking screenshot:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    // Recording IPC handlers
    ipcMain.handle('start-recording', async () => {
        try {
            console.log('Received start-recording request');
            const result = await emulatorService.startRecording();
            return result;
        } catch (err) {
            console.error('Error starting recording:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('stop-recording', async () => {
        try {
            console.log('Received stop-recording request');
            const result = await emulatorService.stopRecording();
            return result;
        } catch (err) {
            console.error('Error stopping recording:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('get-recording-status', async () => {
        try {
            console.log('Checking recording status');
            const status = await emulatorService.getRecordingStatus();
            return status;
        } catch (err) {
            console.error('Error checking recording status:', err);
            return { isRecording: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    // New device control IPC handlers
    ipcMain.handle('device:goHome', async () => {
        try {
            console.log('Received go-home request');
            await emulatorService.executeAdbCommand(['shell', 'input', 'keyevent', 'KEYCODE_HOME']);
            return { success: true };
        } catch (err) {
            console.error('Error executing home command:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('device:goBack', async () => {
        try {
            console.log('Received go-back request');
            await emulatorService.executeAdbCommand(['shell', 'input', 'keyevent', 'KEYCODE_BACK']);
            return { success: true };
        } catch (err) {
            console.error('Error executing back command:', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    });

    ipcMain.handle('device:rotate', async () => {
        try {
            console.log('Received rotate request');
            
            // Get current orientation
            const currentOrientation = await emulatorService.getCurrentOrientation();
            console.log('Current orientation:', currentOrientation);
            
            // Determine target orientation
            const targetOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
            
            // Apply rotation
            const success = await emulatorService.rotateToOrientation(targetOrientation);
            
            if (success) {
                return { 
                    success: true, 
                    orientation: targetOrientation
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to apply rotation'
                };
            }
        } catch (err) {
            console.error('Error rotating device:', err);
            return { 
                success: false, 
                error: err instanceof Error ? err.message : String(err) 
            };
        }
    });

    // Check if device is iOS (always false for Android emulator)
    ipcMain.handle('device:checkPlatform', async () => {
        return { isIos: false };
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});