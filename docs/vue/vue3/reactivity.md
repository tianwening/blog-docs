# reactivity

## reactive、shallowReactive、readonly和shallowReadonly

> reactive是vue3最常用的api之一, 目的主要是将引用类型转换成响应式数据,核心实现依赖于proxy(代理对象)的api, 之前vue2使用的是defineProperty, 需要在初始化的时候进行递归定义getter和setter从而实现属性拦截,vue3中使用proxy可以当访问到具体某个属性值再对值进行代理,可以称得上的懒代理,性能要更好些.

1. 相同点:
   - 这四个API都使用了proxy进行代理操作

2. 不同点:
   - reactive会进行深度代理, 如果对象的属性还是引用类型, 则会对其进行再次代理返回
   - shallowReactive只会对第一层进行代理操作
   - readonly和shallowReadonly代理的对象无法进行set操作, readonly是深层的,而shallowReadonly是浅层的

### reactive代码实现

```js
import {
  reactiveHandler,
  shallowReactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler,
} from './handlers';
import { isObject } from '@vue/shared';
export function reactive(target) {
  return createReactive(target, false, reactiveHandler);
}
export function shallowReactive(target) {
  return createReactive(target, false, shallowReactiveHandler);
}
export function readonly(target) {
  return createReactive(target, true, readonlyHandler);
}
export function shallowReadonly(target) {
  return createReactive(target, true, shallowReadonlyHandler);
}

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

function createReactive(target, isReadonly, baseHandler) {
  if (!isObject(target)) {
    return target;
  }
  let proxyMap = isReadonly ? readonlyMap : reactiveMap;
  let proxy = proxyMap.get(target);

  if (proxy) {
    return proxy;
  }

  proxy = new Proxy(target, baseHandler);
  proxyMap.set(target, proxy);

  return proxy;
}

```



#### handlers部分

```js
import { extend, isArray, isIntegerKey, isObject, hasOwnProperty } from '@vue/shared';
import { reactive, readonly } from './reactive';
import { track, trigger } from './effect';
import { TrackOperator } from './TrackOperator';
import { TriggerOperator } from './TriggerOperator';
const readonlySet = {
  set: (target, key, value, receiver) => {
    console.warn(`${target} can not be set`);
  },
};

function createGetter(isShallow = false, isReadonly = false) {
  return function getter(target, key, receiver) {
    let res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // 进行追踪
      track(target, TrackOperator.GET, key);
    }

    if (isShallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter(isShallow = false) {
  return function setter(target, key, value, receiver) {
    let oldValue = target[key];

    let type;

    if (isArray(target)) {
      if (isIntegerKey(key) && key >= target.length) {
        type = TriggerOperator.ADD;
      } else {
        type = TriggerOperator.SET;
      }
    } else {
      type = hasOwnProperty(target, key) ? TriggerOperator.SET : TriggerOperator.ADD;
    }

    let result = Reflect.set(target, key, value, receiver);
    // 进行更新
    trigger(target, type, key, target[key], oldValue);
    return result;
  };
}

const getter = createGetter();
const shallowGetter = createGetter(true);
const readonlyGetter = createGetter(false, true);
const shallowReadonlyGetter = createGetter(true, true);

const setter = createSetter();
const shallowSetter = createSetter(true);

export const reactiveHandler = {
  get: getter,
  set: setter,
};

export const shallowReactiveHandler = {
  get: shallowGetter,
  set: shallowSetter,
};

export const readonlyHandler = extend(
  {
    get: readonlyGetter,
  },
  readonlySet
);

export const shallowReadonlyHandler = extend(
  {
    get: shallowReadonlyGetter,
  },
  readonlySet
);

```



