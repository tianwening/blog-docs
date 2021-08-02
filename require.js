const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Module {
  constructor() {}
}

Module.extension = {
  '.js': {},
  '.json': {},
};

function myRequire(filename) {
  // 首先将路径解析成一个绝对的路径
  let filepath = path.resolve(__dirname, filename);
  if (!fs.existsSync(filepath)) {
    for (let key in Module.extension) {
      filename = `${filepath}${key}`;
      if (fs.existsSync) {
      }
    }
  } else {
    return filepath;
  }

  throw new Error('路径未找到');
}

myRequire('./a');
