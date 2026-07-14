const fs = require('fs');
const path = require('path');

const postPath = path.join(
  process.cwd(),
  'public',
  '2025',
  '02',
  '12',
  'anaconda',
  'index.html',
);

const expectedSnippets = [
  ['id="giscus"', 'Giscus container should be rendered on post pages.'],
  ['https://giscus.app/client.js', 'Giscus client script should be loaded.'],
  ['"repo":"SummerZhouZihan/techblog"', 'Giscus should point at the techblog repository.'],
  ['"repo-id":"R_kgDOTYTXMQ"', 'Giscus repository ID should match the configured repo.'],
  ['"category":"Announcements"', 'Giscus should use the Announcements discussion category.'],
  ['"category-id":"DIC_kwDOTYTXMc4DBMSN"', 'Giscus category ID should match Announcements.'],
  ['"mapping":"pathname"', 'Giscus should map discussions by page pathname.'],
  ['"input-position":"bottom"', 'Giscus input should appear below comments.'],
  ['"lang":"zh-CN"', 'Giscus should use Simplified Chinese UI.'],
  ['"theme-light":"light_high_contrast"', 'Giscus light theme should match the supplied snippet.'],
];

if (!fs.existsSync(postPath)) {
  throw new Error(`Expected generated post not found: ${postPath}`);
}

const html = fs.readFileSync(postPath, 'utf8');

for (const [snippet, message] of expectedSnippets) {
  if (!html.includes(snippet)) {
    throw new Error(`${message}\nMissing: ${snippet}`);
  }
}

console.log('giscus comments verification passed');
