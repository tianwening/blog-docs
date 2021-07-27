const path = require('path');
module.exports = {
  title: '天问ing',
  description: '这里是一段简单的描述信息',
  head: [['link', { rel: 'icon', href: '/images/favicon.ico' }]],
  base: '/blog-docs/', // 部署时使用的真实路径
  themeConfig: {
    nav: require('./nav/zh'),
  },
  sidebar: {
    '/vuex/': [
      {
        title: '指导',
        collapsable: false,
        children: ['', 'a'],
      },
    ],
  }, // 侧边栏配置
  // sidebarDepth: 3, // 侧边栏显示2级
  extraWatchFiles: ['.vuepress/nav/zh.js'],
};
