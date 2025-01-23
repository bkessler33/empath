const fs = require('fs');
const path = require('path');

// Get the project root directory
const rootDir = path.resolve(__dirname, '..');

// Create dist/main if it doesn't exist
const destDir = path.join(rootDir, 'dist', 'main');
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy preload.js
const sourcePreload = path.join(rootDir, 'dist', 'main', 'preload.js');
const destPreload = path.join(rootDir, 'dist', 'main', 'preload.js');
if (fs.existsSync(sourcePreload)) {
    fs.copyFileSync(sourcePreload, destPreload);
    console.log(`Copied ${sourcePreload} to ${destPreload}`);
}

// Create vendor directory structure in dist
const vendorDest = path.join(rootDir, 'dist', 'vendor', 'scrcpy');
fs.mkdirSync(path.join(vendorDest, 'bin'), { recursive: true });
fs.mkdirSync(path.join(vendorDest, 'lib'), { recursive: true });

// Copy scrcpy binary and server
const scrcpyFiles = [
    { 
        src: path.join(rootDir, 'vendor', 'scrcpy', 'bin', 'scrcpy'),
        dest: path.join(vendorDest, 'bin', 'scrcpy')
    },
    {
        src: path.join(rootDir, 'vendor', 'scrcpy', 'bin', 'scrcpy-server'),
        dest: path.join(vendorDest, 'bin', 'scrcpy-server')
    }
];

// Copy dylib files
const dylibFiles = [
    'libavformat.61.dylib',
    'libavcodec.61.dylib',
    'libavutil.59.dylib',
    'libswresample.5.dylib',
    'libSDL2-2.0.0.dylib',
    'libusb-1.0.0.dylib'
].map(file => ({
    src: path.join(rootDir, 'vendor', 'scrcpy', 'lib', file),
    dest: path.join(vendorDest, 'lib', file)
}));

// Copy all files
[...scrcpyFiles, ...dylibFiles].forEach(({src, dest}) => {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        // Make the binary and dylibs executable
        if (dest.endsWith('scrcpy') || dest.includes('.dylib')) {
            fs.chmodSync(dest, '755');
        }
        console.log(`Copied ${src} to ${dest}`);
    } else {
        console.error(`Source file not found: ${src}`);
    }
});

console.log('Files copied successfully!');