const fs = require('fs');

const htmlPath = './dist/index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const stylesLink = '<link rel="stylesheet" href="./styles.css" />';
const mainCssLink = '<link rel="stylesheet" crossorigin href="/assets/main-';

if (!htmlContent.includes(stylesLink)) {
  htmlContent = htmlContent.replace(mainCssLink, stylesLink + '\n    ' + mainCssLink);
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Added styles.css reference to dist/index.html');
}
