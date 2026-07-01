const fs = require('fs');
const path = require('path');

const targetStr = 'dzirasena';
const replaceStr = 'dzhirasena';
const targetStrCap = 'Dzirasena';
const replaceStrCap = 'Dzhirasena';
const targetStrUpper = 'DZIRASENA';
const replaceStrUpper = 'DZHIRASENA';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if(f !== 'node_modules' && f !== '.git') {
                walkDir(dirPath, callback);
            }
        } else {
            if (dirPath.endsWith('.html') || dirPath.endsWith('.js') || dirPath.endsWith('.css') || dirPath.endsWith('.json')) {
                callback(dirPath);
            }
        }
    });
}

let modifiedCount = 0;

walkDir('.', (filePath) => {
    // skip this script itself
    if(filePath.includes('replace.js') || filePath.includes('package-lock.json')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace all case variations
    content = content.replace(new RegExp(targetStrCap, 'g'), replaceStrCap);
    content = content.replace(new RegExp(targetStr, 'g'), replaceStr);
    content = content.replace(new RegExp(targetStrUpper, 'g'), replaceStrUpper);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
        modifiedCount++;
    }
});

console.log(`Done. Modified ${modifiedCount} files.`);
