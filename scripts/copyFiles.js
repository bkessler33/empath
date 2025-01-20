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

console.log('Files copied successfully!');