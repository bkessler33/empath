import { spawn, ChildProcess, exec } from 'child_process';
import { androidConfig } from '../config/android-config';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';

export class AndroidEmulatorService {
    private emulatorProcess: ChildProcess | null = null;
    public scrcpyProcess: ChildProcess | null = null;
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
            // First, ensure ADB server is running
            await this.executeAdbCommand(['start-server']);
            
            // Kill any existing emulator instances first
            try {
                await this.executeAdbCommand(['emu', 'kill']);
                // Wait a moment for the process to fully close
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log('No existing emulator to kill, proceeding...');
            }
            
            const emulatorArgs = [
                '-avd', deviceName,
                '-gpu', 'host',
                '-no-boot-anim',
                '-no-window',
                '-read-only'  // Add this flag to allow multiple instances
            ];
    
            console.log('Starting emulator with args:', emulatorArgs);
            this.emulatorProcess = spawn(androidConfig.emulatorPath, emulatorArgs);
    
            this.emulatorProcess.stdout?.on('data', (data) => {
                console.log('Emulator stdout:', data.toString());
            });
    
            this.emulatorProcess.stderr?.on('data', (data) => {
                console.error('Emulator stderr:', data.toString());
            });
    
            // Wait for emulator to boot
            const isBooted = await this.waitForBoot();
            if (!isBooted) {
                throw new Error('Emulator failed to boot');
            }
    
            // Start scrcpy after emulator is booted
            await this.startScrcpy();
            await this.manageWindowOrder();  // Add this line
    
            this.isStarting = false;
            return true;
    
        } catch (error) {
            console.error('Failed to start emulator:', error);
            this.isStarting = false;
            return false;
        }
    }
    
    private scrcpyWindowId: string | null = null;  // Add this property

    private async startScrcpy(): Promise<boolean> {
        try {
            const deviceWidth = 412;
            const deviceHeight = 915;
            const scale = androidConfig.defaultScale;
    
            // Calculate initial position based on toolbar position
            const toolbarBounds = BrowserWindow.getFocusedWindow()?.getBounds() || { x: 0, y: 0 };
            const toolbarHeight = 60;
            const gap = 10;
    
            const scrcpyArgs = [
                '--window-title', androidConfig.scrcpy.defaults.windowTitle,
                '--video-bit-rate', '8M',  // Standard format for bit rate
                '--max-fps', '60',
                '--window-borderless',
                '--window-width', Math.round(deviceWidth * scale).toString(),
                '--window-height', Math.round(deviceHeight * scale).toString(),
                '--window-x', toolbarBounds.x.toString(),
                '--window-y', (toolbarBounds.y + toolbarHeight + gap).toString(),
                '--render-driver', 'metal',
                '--stay-awake',    // Keep device awake
                '--power-off-on-close',  // Turn screen off when closing
                // Remove --no-control to allow interaction
                // Remove --always-on-top as we'll manage window order differently
            ];
    
            console.log('Starting scrcpy with args:', scrcpyArgs);
            this.scrcpyProcess = spawn(androidConfig.scrcpy.binaryPath, scrcpyArgs, {
                env: process.env,
                stdio: 'pipe'
            });
    
            // ... (rest of the event handlers)
    
            // Wait for window creation
            await new Promise(resolve => setTimeout(resolve, 2000));
    
            return true;
        } catch (error) {
            console.error('Failed to start scrcpy:', error);
            return false;
        }
    }

    

    private async waitForBoot(): Promise<boolean> {
        return new Promise((resolve) => {
            let bootCheckInterval = setInterval(async () => {
                try {
                    // Check if emulator process exists and exited
                    if (this.emulatorProcess && this.emulatorProcess.exitCode !== null) {
                        console.error(`Emulator process exited with code ${this.emulatorProcess.exitCode}`);
                        clearInterval(bootCheckInterval);
                        resolve(false);
                        return;
                    }
    
                    const devices = await this.executeAdbCommand(['devices']);
                    console.log('Current ADB devices:', devices);
    
                    if (!devices.includes('emulator-')) {
                        console.log('Waiting for emulator to appear in ADB...');
                        return;
                    }
    
                    const result = await this.executeAdbCommand(['shell', 'getprop', 'sys.boot_completed']);
                    if (result.trim() === '1') {
                        clearInterval(bootCheckInterval);
                        console.log('Emulator boot completed successfully');
                        resolve(true);
                    }
                } catch (error) {
                    console.log('Boot check cycle error:', error);
                }
            }, 3000);
    
            setTimeout(() => {
                clearInterval(bootCheckInterval);
                console.error('Emulator boot timeout after 3 minutes');
                resolve(false);
            }, 180000);
        });
    }

    private async manageWindowOrder(): Promise<void> {
        if (process.platform === 'darwin') {
            // Simple shell command to hide dock icon
            exec('defaults write com.genymobile.scrcpy LSUIElement -bool true');
            
            // Use a basic AppleScript just to set window order
            const script = `
                tell application "System Events"
                    set the frontmost of process "Empath" to true
                end tell
            `;
            exec(`osascript -e '${script}'`);
        }
    }

    async executeAdbCommand(args: string[]): Promise<string> {
        console.log('Executing ADB command:', args.join(' '));
        return new Promise((resolve, reject) => {
            const process = spawn(androidConfig.adbPath, args);
            let output = '';
            let errorOutput = '';
    
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
    
            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`ADB stderr: ${data}`);
            });
    
            process.on('close', (code) => {
                console.log(`ADB command completed with code ${code}`);
                console.log('Output:', output);
                if (errorOutput) console.error('Error output:', errorOutput);
                
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`ADB command failed with code ${code}. Error: ${errorOutput}`));
                }
            });
    
            process.on('error', (error) => {
                console.error('ADB process error:', error);
                reject(error);
            });
        });
    }    

    async stopEmulator(): Promise<void> {
        if (this.recordingProcess) {
            try {
                await this.stopRecording();
            } catch (error) {
                console.error('Error stopping recording during emulator shutdown:', error);
            }
        }

        // Stop scrcpy first
        if (this.scrcpyProcess) {
            console.log('Stopping scrcpy...');
            this.scrcpyProcess.kill();
            this.scrcpyProcess = null;
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
            const isRunning = await this.isEmulatorRunning();
            if (!isRunning) {
                return {
                    success: false,
                    error: 'Emulator is not running'
                };
            }
    
            const desktopPath = app.getPath('desktop');
            
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace(/T/, '_')
                .replace(/\..+/, '');
            const filename = `empath_${timestamp}.png`;
            const outputPath = path.join(desktopPath, filename);
    
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
            const isRunning = await this.isEmulatorRunning();
            if (!isRunning) {
                return {
                    success: false,
                    error: 'Emulator is not running'
                };
            }

            if (this.recordingProcess) {
                return {
                    success: false,
                    error: 'Recording is already in progress'
                };
            }

            const args = [
                'shell', 
                'screenrecord',
                '--bit-rate', '8000000',
                '/sdcard/recording.mp4'
            ];

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

            this.recordingProcess.kill('SIGINT');

            await new Promise(resolve => setTimeout(resolve, 1500));

            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace(/T/, '_')
                .replace(/\..+/, '');
            const filename = `empath_${timestamp}.mp4`;
            const outputPath = path.join(app.getPath('desktop'), filename);

            await this.executeAdbCommand(['pull', '/sdcard/recording.mp4', outputPath]);
            await this.executeAdbCommand(['shell', 'rm', '/sdcard/recording.mp4']);

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