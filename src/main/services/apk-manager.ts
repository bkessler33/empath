import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { AndroidEmulatorService } from './android-emulator';

export interface AppInfo {
    version: string;
    lastUpdated: string;
    apkPath: string;
}

export class ApkManagerService {
    private emulatorService: AndroidEmulatorService;
    private appDataPath: string;
    private currentApkPath: string;
    private backupApkPath: string;
    private appInfoPath: string;

    constructor(emulatorService: AndroidEmulatorService) {
        this.emulatorService = emulatorService;
        this.appDataPath = path.join(app.getPath('userData'), 'apks');
        this.currentApkPath = path.join(this.appDataPath, 'current.apk');
        this.backupApkPath = path.join(this.appDataPath, 'backup.apk');
        this.appInfoPath = path.join(this.appDataPath, 'app-info.json');
        this.initializeDirectory();
    }

    private async initializeDirectory() {
        try {
            await fs.mkdir(this.appDataPath, { recursive: true });
        } catch (error) {
            console.error('Error creating APK directory:', error);
        }
    }

    async getCurrentAppInfo(): Promise<AppInfo | null> {
        try {
            const data = await fs.readFile(this.appInfoPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async updateApp(apkPath: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Validate APK file
            const isApk = apkPath.toLowerCase().endsWith('.apk');
            if (!isApk) {
                return { success: false, error: 'Invalid file type. Please provide an APK file.' };
            }

            // Backup current APK if it exists
            try {
                if (await fs.access(this.currentApkPath).then(() => true).catch(() => false)) {
                    await fs.copyFile(this.currentApkPath, this.backupApkPath);
                }
            } catch (error) {
                console.error('Error backing up current APK:', error);
            }

            // Copy new APK to app directory
            await fs.copyFile(apkPath, this.currentApkPath);

            // Get APK version and update timestamp
            const appInfo: AppInfo = {
                version: 'Unknown', // In a full implementation, we'd extract this from the APK
                lastUpdated: new Date().toISOString(),
                apkPath: this.currentApkPath
            };

            // Save app info
            await fs.writeFile(this.appInfoPath, JSON.stringify(appInfo, null, 2));

            // Install APK on emulator if it's running
            const isRunning = await this.emulatorService.isEmulatorRunning();
            if (isRunning) {
                await this.installCurrentApk();
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to update app'
            };
        }
    }

    async rollbackToPreviousVersion(): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if backup exists
            const backupExists = await fs.access(this.backupApkPath)
                .then(() => true)
                .catch(() => false);

            if (!backupExists) {
                return { success: false, error: 'No previous version available' };
            }

            // Swap current and backup
            const tempPath = path.join(this.appDataPath, 'temp.apk');
            await fs.copyFile(this.currentApkPath, tempPath);
            await fs.copyFile(this.backupApkPath, this.currentApkPath);
            await fs.copyFile(tempPath, this.backupApkPath);
            await fs.unlink(tempPath);

            // Update app info
            const appInfo: AppInfo = {
                version: 'Unknown', // In a full implementation, we'd extract this from the APK
                lastUpdated: new Date().toISOString(),
                apkPath: this.currentApkPath
            };

            await fs.writeFile(this.appInfoPath, JSON.stringify(appInfo, null, 2));

            // Install rolled back version if emulator is running
            const isRunning = await this.emulatorService.isEmulatorRunning();
            if (isRunning) {
                await this.installCurrentApk();
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to rollback'
            };
        }
    }

    async installCurrentApk(): Promise<{ success: boolean; error?: string }> {
        try {
            const apkExists = await fs.access(this.currentApkPath)
                .then(() => true)
                .catch(() => false);

            if (!apkExists) {
                return { success: false, error: 'No APK available to install' };
            }

            await this.emulatorService.executeAdbCommand([
                'install', 
                '-r',  // Replace existing application
                '-d',  // Allow version code downgrade
                this.currentApkPath
            ]);

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to install APK'
            };
        }
    }
}