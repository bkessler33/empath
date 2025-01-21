process.env.NAME = "Empath";

import { app, BrowserWindow, ipcMain, screen } from 'electron';  // Add screen to imports
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
    const screenBounds = screen.getPrimaryDisplay().workAreaSize;
    const deviceWidth = 412;
    const toolbarHeight = 60;
    const windowX = (screenBounds.width - deviceWidth) / 2;
    const windowY = screenBounds.height * 0.2;

    mainWindow = new BrowserWindow({
        width: deviceWidth,
        height: toolbarHeight,
        x: windowX,
        y: windowY,
        transparent: true,
        frame: false,
        resizable: false,
        maximizable: false,
        minimizable: true,
        hasShadow: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#00000000',
        titleBarStyle: 'hiddenInset',
        vibrancy: 'under-window'
    });

    // Remove the menu bar and default toolbar
    mainWindow.setMenuBarVisibility(false);
    
    // Track window movement to sync emulator window
    mainWindow.on('move', () => {
        const [x, y] = mainWindow.getPosition();
        emulatorService.positionEmulatorWindow(x, y + toolbarHeight + 10); // Added 10px gap
    });

    // Handle window state changes
    mainWindow.on('minimize', () => {
        const emulatorWindow = emulatorService.findEmulatorWindow();
        if (emulatorWindow) {
            emulatorWindow.minimize();
        }
    });

    mainWindow.on('restore', () => {
        const emulatorWindow = emulatorService.findEmulatorWindow();
        if (emulatorWindow) {
            emulatorWindow.restore();
            // Re-sync position after restore
            const [x, y] = mainWindow.getPosition();
            emulatorService.positionEmulatorWindow(x, y + toolbarHeight + 10);
        }
    });

    const htmlPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(htmlPath);
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
            const success = await emulatorService.startEmulator();
            
            if (success) {
                // Position the emulator window after startup
                const [x, y] = mainWindow.getPosition();
                await emulatorService.positionEmulatorWindow(x, y);
            }
            
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