const path = require('path');
module.exports = {
  title: '天问ing',
  description: '这里是一段简单的描述信息',
  head: [['link', { rel: 'icon', href: '/images/favicon.ico' }]],
  base: '/blog-docs/', // 部署时使用的真实路径
  themeConfig: {
    nav: [
      // 导航栏配置
      { text: 'vuex', link: '/vuex/' },
      { text: '百度', link: 'https://baidu.com' },
    ],
  },
  // configureWebpack: {
  //   resolve: {
  //     alias: {
  //       '@alias': path.resolve(__dirname, './public/images/'),
  //     },
  //   },
  // },
};
