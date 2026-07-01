const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const oldRegex = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter.*?>/g;
const newLink = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(oldRegex, newLink);
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
});
