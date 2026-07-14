const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Expected generated homepage not found: ${indexPath}`);
}

const html = fs.readFileSync(indexPath, 'utf8');
const titleVariants = ["Zihan Zhou's Blog", 'Zihan Zhou&#39;s Blog', 'Zihan Zhou&apos;s Blog'];

function hasAny(snippets) {
  return snippets.some((snippet) => html.includes(snippet));
}

function expectAny(message, snippets) {
  if (!hasAny(snippets)) {
    throw new Error(`${message}\nMissing one of:\n${snippets.join('\n')}`);
  }
}

expectAny(
  'Browser tab title should use the new site name.',
  titleVariants.map((title) => `<title>${title}</title>`),
);

expectAny(
  'Open Graph site title should use the new site name.',
  titleVariants.map((title) => `property="og:title" content="${title}"`),
);

expectAny(
  'Navbar brand should use the new site name.',
  titleVariants.map((title) => `<strong>${title}</strong>`),
);

expectAny(
  'Footer brand should use the new site name.',
  titleVariants.map((title) => `<span>${title}</span>`),
);

if (!html.includes('data-typed-text="Learning Deep, Have Fun Coding!"')) {
  throw new Error('Homepage typing subtitle should use the new text.');
}

for (const label of ['Home', 'Archives', 'Categories', 'Tags', 'About', 'Links']) {
  if (!html.includes(`<span>${label}</span>`)) {
    throw new Error(`Top navigation should include "${label}".`);
  }
}

for (const label of ['首页', '归档', '分类', '标签', '关于']) {
  if (html.includes(`<span>${label}</span>`)) {
    throw new Error(`Top navigation should not include "${label}".`);
  }
}

console.log('site branding verification passed');
