const path = require('path');
module.exports = {
  title: '天问ing',
  description: '一些学习过程中的随笔记录',
  head: [['link', { rel: 'icon', href: '/images/favicon.ico' }]],
  base: '/blog-docs/', // 部署时使用的真实路径
  themeConfig: {
    nav: require('./nav/zh'),
    smoothScroll: true,
    sidebar: {
      '/vuex/': [''],
    },
    sidebarDepth: 2,
    prevLinks: true,
    nextLinks: true,
  },
  extraWatchFiles: ['.vuepress/nav/zh.js'],
  plugins: ['@vuepress/active-header-links', '@vuepress/back-to-top', '@vuepress/nprogress'],
};
