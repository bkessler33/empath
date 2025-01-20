cat > scripts/verifyFiles.js << 'EOL'
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Check dist structure
console.log('Checking dist directory...');
const distPath = path.join(rootDir, 'dist');
const rendererPath = path.join(distPath, 'renderer');
const mainPath = path.join(distPath, 'main');

console.log('Dist exists:', fs.existsSync(distPath));
console.log('Renderer exists:', fs.existsSync(rendererPath));
console.log('Main exists:', fs.existsSync(mainPath));

// Check HTML file
const htmlPath = path.join(rendererPath, 'index.html');
console.log('HTML exists:', fs.existsSync(htmlPath));
if (fs.existsSync(htmlPath)) {
    console.log('HTML contents:', fs.readFileSync(htmlPath, 'utf8'));
}
EOL