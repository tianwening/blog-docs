# require

nodejs里面模块的加载和解析使用的是commonjs规范，require可以用来把一个资源加载进来，可以把一个资源看成一个个的模块，require的作用就是读取文件的内容，根据不同的后缀实现不同的处理方式， 最终将结果放到module.exports属性上面进行导出

## myRequire

1. 首先需要把传递的路径解析成绝对路径，如果用户没有传递后缀会遍历支持的文件类型补全路径去进行解析
2. 先从缓存中读取， 如果缓存已经存在， 直接返回
3. 缓存不存在，新建一个模块，并根据改模块的id进行相应的缓存
4. 执行模块的load操作，并返回module.exports属性

```js
function myRequire(filename) {
  let filepath = resolvePath(filename);

  // 先从缓存里面获取
  if (Module.cached[filepath]) {
    return Module.cached[filepath];
  }

  let module = new Module(filepath);

  Module.cached[module.id] = module;

  // 加载模块
  module.load();

  return module.exports;
}
```

## resolvePath

```js
function resolvePath(filename) {
  // 首先将路径解析成一个绝对的路径
  let filepath = path.resolve(__dirname, filename);
  if (!fs.existsSync(filepath)) {
    for (let key in Module.extension) {
      if (fs.existsSync(`${filepath}${key}`)) {
        return `${filepath}${key}`;
      }
    }
  } else {
    return filepath;
  }

  throw new Error('路径未找到');
}
```

## Module

```
class Module {
  constructor(id) {
    this.id = id;
    this.exports = {};
  }
  load() {
    //  获取文件后缀
    let extname = path.extname(this.id);
    Module.extension[extname](this);
  }
}

Module.cached = {};

Module.extension = {
  '.js'(module) {
    let content = fs.readFileSync(module.id, 'utf8'); // 先将内容读取出来
    let template = `function compileFunction(module, exports, require, __filename, __dirname) {${content}}`;
    let thisValue = (exports = module.exports);
    let __filename = module.id;
    let __dirname = path.dirname(module.id);
    vm.runInThisContext(template);
    compileFunction.call(thisValue, module, exports, myRequire, __filename, __dirname);
  },
  '.json'(module) {
    let content = fs.readFileSync(module.id, 'utf8');
    module.exports = JSON.parse(content);
  },
};
```

