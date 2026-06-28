const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Add glassmorphism variables to :root
css = css.replace(
    /--bg-card: #FFFFFF;/g, 
    '--bg-card: #FFFFFF;\n    --bg-glass: rgba(255, 255, 255, 0.85);'
);

// Add glassmorphism variables to .dark-theme
css = css.replace(
    /--bg-card: #1F2937;/g,
    '--bg-card: #1F2937;\n    --bg-glass: rgba(31, 41, 55, 0.85);'
);

// Apply glassmorphism to .dropdown-menu
css = css.replace(
    /\.dropdown-menu \{([\s\S]*?)\}/g,
    (match, p1) => {
        if (!p1.includes('backdrop-filter')) {
            return `.dropdown-menu {${p1}\n    background-color: var(--bg-glass);\n    backdrop-filter: blur(12px);\n    -webkit-backdrop-filter: blur(12px);\n}`;
        }
        return match;
    }
);

// Apply glassmorphism to .modal-content
css = css.replace(
    /\.modal-content \{([\s\S]*?)\}/g,
    (match, p1) => {
        if (!p1.includes('backdrop-filter')) {
            let replaced = p1.replace(/background-color: var\(--bg-card\);/g, ''); // remove the original background color
            return `.modal-content {${replaced}\n    background-color: var(--bg-glass);\n    backdrop-filter: blur(16px);\n    -webkit-backdrop-filter: blur(16px);\n}`;
        }
        return match;
    }
);

fs.writeFileSync('styles.css', css);
console.log('Glassmorphism applied.');
