import { spawn, ChildProcess } from 'child_process';
import { androidConfig } from '../config/android-config';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';

export class AndroidEmulatorService {
    private emulatorProcess: ChildProcess | null = null;
    private recordingProcess: ChildProcess | null = null;
    private isStarting: boolean = false;
    private recordingStartTime: number | null = null;

    constructor() {}

    async startEmulator(
        deviceName: string = androidConfig.defaultDevice
    ): Promise<boolean> {
        if (this.isStarting) {
            console.log('Emulator is already starting...');
            return false;
        }
    
        this.isStarting = true;
    
        try {
            // Start emulator with arguments to remove window decorations
            const emulatorArgs = [
                '-avd', deviceName,
                '-gpu', 'host',
                '-no-boot-anim',
                '-no-title',           // Remove title bar
                '-no-frame',           // Remove window frame
                '-no-skin',            // Remove default emulator skin
                '-skindir', 'none'     // Disable skin directory
            ];
    
            console.log('Starting emulator with args:', emulatorArgs);
            this.emulatorProcess = spawn(androidConfig.emulatorPath, emulatorArgs);
    
            // Wait for emulator to start, then set its window properties
            const isBooted = await this.waitForBoot();
            if (isBooted) {
                const emulatorWindow = this.findEmulatorWindow();
                if (emulatorWindow) {
                    // Make emulator window borderless and the right size
                    emulatorWindow.setWindowButtonVisibility(false);
                    emulatorWindow.setContentSize(1280, 2800); // Adjust height as needed
                    emulatorWindow.setResizable(false);
                }
            }
    
            this.isStarting = false;
            return isBooted;
    
        } catch (error) {
            console.error('Failed to start emulator:', error);
            this.isStarting = false;
            return false;
        }
    }

    private async waitForBoot(): Promise<boolean> {
        return new Promise((resolve) => {
            let bootCheckInterval = setInterval(async () => {
                try {
                    const result = await this.executeAdbCommand(['shell', 'getprop', 'sys.boot_completed']);
                    if (result.trim() === '1') {
                        clearInterval(bootCheckInterval);
                        console.log('Emulator boot completed');
                        resolve(true);
                    }
                } catch (error) {
                    console.error('Boot check failed:', error);
                }
            }, 1000);

            // Timeout after 2 minutes
            setTimeout(() => {
                clearInterval(bootCheckInterval);
                console.error('Emulator boot timeout');
                resolve(false);
            }, 120000);
        });
    }

    async executeAdbCommand(args: string[]): Promise<string> {
        console.log('Executing ADB command:', args.join(' '));
        return new Promise((resolve, reject) => {
            const process = spawn(androidConfig.adbPath, args);
            let output = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`ADB command failed with code ${code}`));
                }
            });
        });
    }

    findEmulatorWindow(): BrowserWindow | null {
        const allWindows = BrowserWindow.getAllWindows();
        const emulatorWindow = allWindows.find(win => {
            const title = win.getTitle();
            return title.includes('Android Emulator') || title.includes('Pixel');
        });
        return emulatorWindow || null;
    }

    async positionEmulatorWindow(parentX: number, parentY: number): Promise<void> {
        const emulatorWindow = this.findEmulatorWindow();
        if (emulatorWindow) {
            // Position window and ensure it's borderless
            emulatorWindow.setPosition(parentX, parentY);
            emulatorWindow.setWindowButtonVisibility(false);
            emulatorWindow.setAlwaysOnTop(false); // Ensure it stays under the toolbar
        }
    }

    async stopEmulator(): Promise<void> {
        if (this.recordingProcess) {
            try {
                await this.stopRecording();
            } catch (error) {
                console.error('Error stopping recording during emulator shutdown:', error);
            }
        }

        if (this.emulatorProcess) {
            console.log('Stopping emulator...');
            this.emulatorProcess.kill();
            this.emulatorProcess = null;
            
            // Force-stop any remaining emulator processes
            try {
                await this.executeAdbCommand(['emu', 'kill']);
            } catch (error) {
                console.error('Error stopping emulator:', error);
            }
        }
    }

    async isEmulatorRunning(): Promise<boolean> {
        try {
            console.log('Checking if emulator is running...');
            const devices = await this.executeAdbCommand(['devices']);
            console.log('ADB devices output:', devices);
            // Look for 'emulator-' instead of just 'emulator'
            const isRunning = devices.includes('emulator-');
            console.log('Is emulator running?', isRunning, 'Raw devices output:', devices);
            return isRunning;
        } catch (error) {
            console.error('Error checking emulator status:', error);
            return false;
        }
    }

    async takeScreenshot(): Promise<{ success: boolean; path?: string; error?: string }> {
        try {
            // Check if emulator is running first
            const isRunning = await this.isEmulatorRunning();
            if (!isRunning) {
                return {
                    success: false,
                    error: 'Emulator is not running'
                };
            }
    
            const desktopPath = app.getPath('desktop');
            
            // Create filename: empath_YYYYMMDD_HHMMSS.png
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace(/T/, '_')
                .replace(/\..+/, '');
            const filename = `empath_${timestamp}.png`;
            const outputPath = path.join(desktopPath, filename);
    
            // Take the screenshot using adb and get raw data
            const process = spawn(androidConfig.adbPath, ['exec-out', 'screencap', '-p']);
            
            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                
                process.stdout.on('data', (chunk) => {
                    chunks.push(Buffer.from(chunk));
                });
    
                process.stderr.on('data', (data) => {
                    console.error(`Screenshot error: ${data}`);
                });
    
                process.on('close', async (code) => {
                    if (code !== 0) {
                        resolve({
                            success: false,
                            error: `Screenshot failed with code ${code}`
                        });
                        return;
                    }
    
                    try {
                        const buffer = Buffer.concat(chunks);
                        await fs.writeFile(outputPath, buffer);
                        
                        resolve({
                            success: true,
                            path: outputPath
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            error: error instanceof Error ? error.message : 'Failed to save screenshot'
                        });
                    }
                });
    
                process.on('error', (error) => {
                    resolve({
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to capture screenshot'
                    });
                });
            });
    
        } catch (error) {
            console.error('Screenshot error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown screenshot error'
            };
        }
    }

    async startRecording(): Promise<{ success: boolean; path?: string; error?: string }> {
        try {
            // Check if emulator is running
            const isRunning = await this.isEmulatorRunning();
            if (!isRunning) {
                return {
                    success: false,
                    error: 'Emulator is not running'
                };
            }

            // Check if already recording
            if (this.recordingProcess) {
                return {
                    success: false,
                    error: 'Recording is already in progress'
                };
            }

            // Using 8Mbps bitrate for good quality
            const args = [
                'shell', 
                'screenrecord',
                '--bit-rate', '8000000',  // 8 Mbps
                '/sdcard/recording.mp4'
            ];

            // Start recording
            this.recordingProcess = spawn(androidConfig.adbPath, args);
            this.recordingStartTime = Date.now();

            this.recordingProcess.stderr?.on('data', (data) => {
                console.error(`Recording stderr: ${data}`);
            });

            this.recordingProcess.on('error', (error) => {
                console.error('Recording process error:', error);
                this.recordingProcess = null;
                this.recordingStartTime = null;
            });

            // Wait a bit to ensure recording started successfully
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (this.recordingProcess?.killed) {
                return {
                    success: false,
                    error: 'Recording process failed to start'
                };
            }

            return {
                success: true
            };

        } catch (error) {
            console.error('Failed to start recording:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown recording error'
            };
        }
    }

    async stopRecording(): Promise<{ success: boolean; path?: string; error?: string }> {
        try {
            if (!this.recordingProcess) {
                return {
                    success: false,
                    error: 'No recording in progress'
                };
            }

            // Send SIGINT to stop recording gracefully
            this.recordingProcess.kill('SIGINT');

            // Wait for the process to finish
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Create output path with same naming convention as screenshots
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace(/T/, '_')
                .replace(/\..+/, '');
            const filename = `empath_${timestamp}.mp4`;
            const outputPath = path.join(app.getPath('desktop'), filename);

            // Pull the recording from device to desktop
            await this.executeAdbCommand(['pull', '/sdcard/recording.mp4', outputPath]);

            // Clean up the file on device
            await this.executeAdbCommand(['shell', 'rm', '/sdcard/recording.mp4']);

            // Reset recording state
            this.recordingProcess = null;
            this.recordingStartTime = null;

            return {
                success: true,
                path: outputPath
            };

        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.recordingProcess = null;
            this.recordingStartTime = null;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to stop recording'
            };
        }
    }

    async getRecordingStatus(): Promise<{ isRecording: boolean; duration?: number; error?: string }> {
        try {
            if (!this.recordingProcess || !this.recordingStartTime) {
                return { isRecording: false };
            }

            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            return {
                isRecording: true,
                duration
            };

        } catch (error) {
            console.error('Failed to get recording status:', error);
            return {
                isRecording: false,
                error: error instanceof Error ? error.message : 'Failed to get recording status'
            };
        }
    }
    
    async getCurrentOrientation(): Promise<'portrait' | 'landscape'> {
        try {
            const rotationResult = await this.executeAdbCommand([
                'shell',
                'settings',
                'get',
                'system',
                'user_rotation'
            ]);
            console.log('Current rotation setting:', rotationResult);

            const rotation = rotationResult.trim();
            return rotation === '1' || rotation === '3' ? 'landscape' : 'portrait';
        } catch (error) {
            console.error('Error getting orientation:', error);
            return 'portrait';
        }
    }

    async rotateToOrientation(targetOrientation: 'portrait' | 'landscape'): Promise<boolean> {
        try {
            const currentOrientation = await this.getCurrentOrientation();
            console.log('Current orientation before rotation:', currentOrientation);
            console.log('Target orientation:', targetOrientation);

            if (currentOrientation === targetOrientation) {
                console.log('Already in target orientation');
                return true;
            }

            // 1. Disable auto-rotation
            await this.executeAdbCommand([
                'shell',
                'settings',
                'put',
                'system',
                'accelerometer_rotation',
                '0'
            ]);

            // 2. Set the system rotation
            const rotationValue = targetOrientation === 'landscape' ? '1' : '0';
            console.log(`Setting rotation to ${rotationValue}`);
            await this.executeAdbCommand([
                'shell',
                'settings',
                'put',
                'system',
                'user_rotation',
                rotationValue
            ]);

            // 3. If going to landscape, rotate twice to simulate left rotation
            if (currentOrientation === 'portrait' && targetOrientation === 'landscape') {
                console.log('Rotating left (using 3 rotations right)');
                await this.executeAdbCommand(['emu', 'rotate']);
                await new Promise(resolve => setTimeout(resolve, 200));
                await this.executeAdbCommand(['emu', 'rotate']);
                await new Promise(resolve => setTimeout(resolve, 200));
                await this.executeAdbCommand(['emu', 'rotate']);
            } else {
                // For going back to portrait, one rotation is fine
                console.log('Rotating right');
                await this.executeAdbCommand(['emu', 'rotate']);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const newOrientation = await this.getCurrentOrientation();
            console.log('New orientation after rotation:', newOrientation);
            return newOrientation === targetOrientation;
        } catch (error) {
            console.error('Error rotating device:', error);
            return false;
        }
    }
}