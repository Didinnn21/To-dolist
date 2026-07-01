const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// The marker for dark theme overrides
const marker = '/* Base text overrides */';
const darkThemeIndex = css.indexOf(marker);

if (darkThemeIndex !== -1) {
    // Keep everything before the marker (which includes the pure variable re-declarations)
    css = css.substring(0, darkThemeIndex);
}

// Ensure the last block is closed properly if we cut it weirdly, but the marker is right after the body.dark-theme {} block.
fs.writeFileSync('styles.css', css);
console.log('Cleanup completed!');
