import { Menu, dialog, BrowserWindow, app, MenuItemConstructorOptions } from 'electron';
import { ApkManagerService } from './apk-manager';
import { AndroidEmulatorService } from './android-emulator';
import { store } from '../config/store';

export class MenuService {
    private apkManager: ApkManagerService;
    private mainWindow: BrowserWindow;
    private emulatorService: AndroidEmulatorService;

    constructor(
        apkManager: ApkManagerService, 
        mainWindow: BrowserWindow,
        emulatorService: AndroidEmulatorService
    ) {
        this.apkManager = apkManager;
        this.mainWindow = mainWindow;
        this.emulatorService = emulatorService;
        this.setupMenu();
    }

    private setupMenu() {
        const template: MenuItemConstructorOptions[] = [
            {
                label: app.name,
                submenu: [
                    { type: 'normal', label: 'About Empath', role: 'about' },
                    { type: 'separator' },
                    {
                        label: 'Update Test App',
                        click: async () => {
                            const result = await dialog.showOpenDialog({
                                properties: ['openFile'],
                                filters: [
                                    { name: 'APK Files', extensions: ['apk'] }
                                ]
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                const confirmResult = await dialog.showMessageBox({
                                    type: 'question',
                                    buttons: ['Update', 'Cancel'],
                                    defaultId: 0,
                                    message: 'Are you sure you want to update the test app?',
                                    detail: 'Current version will be backed up.'
                                });

                                if (confirmResult.response === 0) {
                                    const updateResult = await this.apkManager.updateApp(result.filePaths[0]);
                                    if (updateResult.success) {
                                        this.mainWindow.webContents.send('app-updated');
                                    } else {
                                        dialog.showErrorBox('Update Failed', 
                                            updateResult.error || 'Failed to update app');
                                    }
                                }
                            }
                        }
                    },
                    {
                        label: 'Rollback to Previous Version',
                        click: async () => {
                            const confirmResult = await dialog.showMessageBox({
                                type: 'question',
                                buttons: ['Rollback', 'Cancel'],
                                defaultId: 0,
                                message: 'Are you sure you want to rollback to the previous version?'
                            });

                            if (confirmResult.response === 0) {
                                const rollbackResult = await this.apkManager.rollbackToPreviousVersion();
                                if (rollbackResult.success) {
                                    this.mainWindow.webContents.send('app-updated');
                                } else {
                                    dialog.showErrorBox('Rollback Failed', 
                                        rollbackResult.error || 'Failed to rollback');
                                }
                            }
                        }
                    },
                    { type: 'separator' },
                    { type: 'normal', label: 'Services', role: 'services' },
                    { type: 'separator' },
                    { type: 'normal', label: 'Hide Empath', role: 'hide' },
                    { type: 'normal', label: 'Hide Others', role: 'hideOthers' },
                    { type: 'normal', label: 'Show All', role: 'unhide' },
                    { type: 'separator' },
                    { type: 'normal', label: 'Quit Empath', role: 'quit' }
                ]
            },
            {
                label: 'Devices',
                submenu: [
                    {
                        label: 'New device',
                        submenu: [
                            {
                                label: '🤖 Google Pixel 9 Pro',  // User-friendly display name
                                click: async () => {
                                    try {
                                        this.mainWindow.webContents.send('select-device', 'pixel9pro');
                                        
                                        // Show loading dialog
                                        dialog.showMessageBox(this.mainWindow, {
                                            type: 'info',
                                            title: 'Starting Emulator',
                                            message: 'Please wait while the emulator starts...',
                                            buttons: ['OK']
                                        });
            
                                        // Use the technical AVD name internally
                                        const result = await this.emulatorService.startEmulator('Pixel_9_Pro_API_35');
                                        
                                        if (!result) {
                                            dialog.showMessageBox(this.mainWindow, {
                                                type: 'error',
                                                title: 'Emulator Error',
                                                message: 'Failed to start the emulator. Please check your Android Studio installation and AVD setup.'
                                            });
                                        }
                                    } catch (error) {
                                        console.error('Emulator start error:', error);
                                        dialog.showMessageBox(this.mainWindow, {
                                            type: 'error',
                                            title: 'Emulator Error',
                                            message: `Failed to start emulator: ${error instanceof Error ? error.message : 'Unknown error'}`
                                        });
                                    }
                                }
                            },
                            {
                                label: ' iPhone 16 Pro',
                                click: () => {
                                    dialog.showMessageBox(this.mainWindow, {
                                        type: 'info',
                                        title: 'Coming Soon',
                                        message: 'iPhone emulation support is coming soon!'
                                    });
                                }
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Bookmarks',
                submenu: []
            },
            {
                label: 'Test Accounts',
                submenu: []
            },
            {
                label: 'Edit',
                submenu: [
                    { type: 'normal', label: 'Undo', role: 'undo' },
                    { type: 'normal', label: 'Redo', role: 'redo' },
                    { type: 'separator' },
                    { type: 'normal', label: 'Cut', role: 'cut' },
                    { type: 'normal', label: 'Copy', role: 'copy' },
                    { type: 'normal', label: 'Paste', role: 'paste' },
                    { type: 'normal', label: 'Select All', role: 'selectAll' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { type: 'normal', label: 'Minimize', role: 'minimize' },
                    { type: 'normal', label: 'Zoom', role: 'zoom' }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
}