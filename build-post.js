const fs = require('fs');
const path = require('path');

// 1. Inject styles.css link into index.html
const htmlPath = './dist/index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const stylesLink = '<link rel="stylesheet" href="./styles.css" />';
const mainCssLink = '<link rel="stylesheet" crossorigin href="./assets/main-';

if (!htmlContent.includes(stylesLink)) {
  htmlContent = htmlContent.replace(mainCssLink, stylesLink + '\n    ' + mainCssLink);
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Added styles.css reference to dist/index.html');
}

// 2. Copy static assets to dist (cross-platform)
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`Copied ${src} -> ${dest}`);
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

copyDir('imag', 'dist/imag');
copyDir('vendor', 'dist/vendor');
copyDir('js', 'dist/js');
copyFile('script.js', 'dist/script.js');
copyFile('styles.css', 'dist/styles.css');
copyFile('project-detail.css', 'dist/project-detail.css');
copyFile('skills-lock.json', 'dist/skills-lock.json');
