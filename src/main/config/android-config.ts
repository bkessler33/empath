import * as path from 'path';
import { app } from 'electron';

const getBasePath = () => {
    if (process.env.NODE_ENV === 'development') {
        return path.join(__dirname, '../..');
    }
    return app.getAppPath();
};

export const androidConfig = {
    sdkPath: '/Users/bkessler/Library/Android/sdk',
    emulatorPath: '/Users/bkessler/Library/Android/sdk/emulator/emulator',
    adbPath: '/Users/bkessler/Library/Android/sdk/platform-tools/adb',
    defaultDevice: 'Pixel_9_Pro_API_35',
    defaultScale: 0.75,
    scrcpy: {
        // Use the actual binary path instead of the symlink
        binaryPath: '/opt/homebrew/Cellar/scrcpy/3.1/bin/scrcpy',
        serverPath: '/opt/homebrew/Cellar/scrcpy/3.1/share/scrcpy/scrcpy-server',
        defaults: {
            bitrate: '8M',
            maxFps: 60,
            windowTitle: 'Empath Display',
            windowBorderless: true,
            renderDriver: 'metal'
        }
    }
};

export const scalingOptions = [
    { label: '100%', value: 1.0 },
    { label: '75%', value: 0.75 },
    { label: '50%', value: 0.5 },
    { label: '25%', value: 0.25 }
];