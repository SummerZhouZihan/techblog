# Techblog Migration Plan

## Goal

Build a new Hexo + Fluid blog in `SummerZhouZihan/techblog` while keeping the old GitHub Pages blog at `https://summerzhouzihan.github.io/` available.

## Publishing Strategy

The new site is configured as a GitHub Project Pages site:

- Old blog: `https://summerzhouzihan.github.io/`
- New blog: `https://summerzhouzihan.github.io/techblog/`

This is controlled by Hexo's `url` and `root` settings in `_config.yml`.

## Implementation Steps

1. Initialize an independent Git repository in `D:\gitcode\techblog`.
2. Use the official Fluid theme as `themes/fluid`.
3. Configure Hexo with `theme: fluid`, `language: zh-CN`, and `root: /techblog/`.
4. Migrate old Jekyll posts from `D:\gitcode\SummerZhouZihan_blog\_posts` to `source/_posts`.
5. Convert post front matter from Jekyll fields to Fluid-friendly fields such as `banner_img` and `math`.
6. Copy image assets from the old blog into `source/img`.
7. Recreate the About, Tags, Categories, and Links pages.
8. Add a GitHub Actions workflow that builds Hexo and deploys `public/` to GitHub Pages.
9. Verify with `npm run build`.
