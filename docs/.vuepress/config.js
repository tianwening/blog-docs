module.exports = {
  title: '个人学习使用',
  description: '这里是一段简单的描述信息',
  base: '/docs/', // 部署时使用的真实路径
  configureWebpack: {
    resolve: {
      alias: {
        '@images': './public/images',
      },
    },
  },
};
