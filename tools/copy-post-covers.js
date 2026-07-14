const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'source', 'img', 'post-cover');
const publicDir = path.join(root, 'public', 'img', 'post-cover');

if (!fs.existsSync(sourceDir)) {
  console.log('[post-cover] no source/img/post-cover directory found; skipped');
  process.exit(0);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(sourceDir, publicDir, { recursive: true, force: true });

const copied = fs
  .readdirSync(sourceDir)
  .filter((name) => fs.statSync(path.join(sourceDir, name)).isFile()).length;

console.log(`[post-cover] copied ${copied} cover image(s) to public/img/post-cover`);
