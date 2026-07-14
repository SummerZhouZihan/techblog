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

function assertContains(html, needle, message) {
  if (!html.includes(needle)) {
    throw new Error(`${message}\nMissing: ${needle}`);
  }
}

if (!fs.existsSync(postPath)) {
  throw new Error(`Expected generated post not found: ${postPath}`);
}

const html = fs.readFileSync(postPath, 'utf8');

assertContains(
  html,
  'sidebar category-bar',
  'Post page should render the Fluid category sidebar on the left.',
);
assertContains(
  html,
  'category-post-list',
  'Category sidebar should contain a list of posts in the current category.',
);
assertContains(
  html,
  '/techblog/2025/02/18/linear/',
  'Category sidebar should link to another post in the same category.',
);
assertContains(
  html,
  'active',
  'Category sidebar should mark the current post as active.',
);

console.log('category bar verification passed');
