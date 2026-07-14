# Summer Tech Blog

New Hexo + Fluid technical blog for Project Pages:

https://summerzhouzihan.github.io/techblog/

The old blog remains available at:

https://summerzhouzihan.github.io/

## Local Development

```bash
npm install
npm run server
```

## Build

```bash
npm run build
```



## 更新方法

在新建文章的标题，加

```
---
title: "你的文章标题"
subtitle: "一句短描述"
date: 2026-07-14 20:00:00
author: "Summer"
banner_img: /img/home-bg.jpg
index_img: /img/home-bg.jpg
categories: LLM
tags:
  - LLM
  - Agent
excerpt: "首页摘要会显示这句话。"
math: true
---

# 正文标题

这里开始写正文。

## 小节

代码块、公式、目录、搜索、归档、分类、标签都会自动处理。
```

然后

```
cd D:\gitcode\techblog
npm run build
git add source/_posts/2026-07-14-your-title.md
git commit -m "post: add your title"
git push
```