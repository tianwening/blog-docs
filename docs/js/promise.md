# promise

> **Promise** 对象用于表示一个异步操作的最终完成 (或失败)及其结果值。
>
> 一个 `Promise` 对象代表一个在这个 promise 被创建出来时不一定已知的值。它让您能够把异步操作最终的成功返回值或者失败原因和相应的处理程序关联起来。 这样使得异步方法可以像同步方法那样返回值：异步方法并不会立即返回最终的值，而是会返回一个 *promise*，以便在未来某个时候把值交给使用者。
>
> 一个 `Promise` 必然处于以下几种状态之一：
>
> - *待定（pending）*: 初始状态，既没有被兑现，也没有被拒绝。
> - *已兑现（fulfilled）*: 意味着操作成功完成。
> - *已拒绝（rejected）*: 意味着操作失败。

## promise状态

```js
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;

    const resolve = value => {
      this.status = FULFILLED;
      this.value = value;
    };

    const reject = reason => {
      this.status = REJECTED;
      this.reason = reason;
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
}
```

## then

> promise都拥有then方法，成功执行成功的回调， 失败执行失败回调，then方法可以进行链式操作，所以then其实是返回了一个新的promise，返回的promise依赖于回调的返回结果， 如果返回新的promise， 要一直等待执行完毕， 最终返回一个原始值

```js
then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : data => data;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : e => {
            throw e;
          };

    let promise2 = new Promise((resolve, reject) => {
      // 同步执行了resolve
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      // 同步执行了reject
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      // 异步执行resolve或reject
      if (this.status === PENDING) {
        // 把用户传递的函数放到成功回调中去，用户执行resolve时执行
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        // 把用户传递的函数放到失败回调中去，用户执行reject时执行
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });

    return promise2;
  }
```

## resolvePromise

![image-20210806104803064](https://cdn.tianwening.top/images/image-20210806104803064.png)

```js
function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
  }

  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    let called;
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(
          x,
          y => {
            if (called) {
              return;
            }
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) {
              return;
            }
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) {
        return;
      }
      called = true;
      reject(e);
    }
  } else {
    // 原始值
    resolve(x);
  }
}
```



## promise测试

npm或者yarn安装promises-aplus-tests库， 执行promises-aplus-tests 具体文件名即可

```
Promise.defer = Promise.deferred = function () {
  let dtd = {};

  dtd.promise = new Promise((resolve, reject) => {
    dtd.resolve = resolve;
    dtd.reject = reject;
  });

  return dtd;
};
```

### promise完整代码

```js
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
  }

  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    let called;
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(
          x,
          y => {
            if (called) {
              return;
            }
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) {
              return;
            }
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) {
        return;
      }
      called = true;
      reject(e);
    }
  } else {
    // 原始值
    resolve(x);
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = value => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.onFulfilledCallbacks.forEach(cb => cb());
      }
    };

    const reject = reason => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb());
      }
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : data => data;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : e => {
            throw e;
          };

    let promise2 = new Promise((resolve, reject) => {
      // 同步执行了resolve
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      // 同步执行了reject
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      // 异步执行resolve或reject
      if (this.status === PENDING) {
        // 把用户传递的函数放到成功回调中去，用户执行resolve时执行
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        // 把用户传递的函数放到失败回调中去，用户执行reject时执行
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });

    return promise2;
  }
}

Promise.defer = Promise.deferred = function () {
  let dtd = {};

  dtd.promise = new Promise((resolve, reject) => {
    dtd.resolve = resolve;
    dtd.reject = reject;
  });

  return dtd;
};

module.exports = Promise;
```

