const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (stat.isFile()) {
      callback(filepath);
    }
  }
}

const srcDir = path.join(__dirname, '..', 'src');

console.log(`Starting replacement in: ${srcDir}`);

let updatedFilesCount = 0;

walk(srcDir, (filepath) => {
  const filename = path.basename(filepath);
  
  if (filename === 'index.css' || filename === 'themeManager.ts') {
    return;
  }
  
  const ext = path.extname(filepath);
  if (ext !== '.tsx' && ext !== '.ts' && ext !== '.css' && ext !== '.js') {
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // 1. Replace #ea4c2a/opacity (e.g. #ea4c2a/15) with rgba(var(--theme-color-rgb), 0.15)
  content = content.replace(/#ea4c2a\/(\d+)/gi, (match, opacityStr) => {
    const opacity = parseInt(opacityStr, 10) / 100;
    return `rgba(var(--theme-color-rgb),${opacity})`;
  });

  // 2. Replace #ea4c2a with var(--theme-color)
  content = content.replace(/#ea4c2a/gi, 'var(--theme-color)');

  // 3. Replace #d83f1d/opacity with rgba(var(--theme-color-rgb), opacity)
  content = content.replace(/#d83f1d\/(\d+)/gi, (match, opacityStr) => {
    const opacity = parseInt(opacityStr, 10) / 100;
    return `rgba(var(--theme-color-rgb),${opacity})`;
  });

  // 4. Replace #d83f1d with var(--theme-color-hover)
  content = content.replace(/#d83f1d/gi, 'var(--theme-color-hover)');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated: ${filepath}`);
    updatedFilesCount++;
  }
});

console.log(`Replacement complete! Updated ${updatedFilesCount} files.`);
