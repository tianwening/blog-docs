# reactivity

## reactive

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



### handlers部分

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

## effect

> vue3中的effect表示副作用函数，参数是函数，函数中如果存在响应式数据，当参数执行访问到响应式时会将该effect自动进行收集，当响应式数据下一次发生变化时， 找到所对应的副作用函数集合循环遍历执行。自动收集实现实际上是定义了一个activeEffect的变量，当effect执行时，将该变量指向执行的effect，访问到响应式数据时对进行相应的track的操作，里面会去取activeEffect，然后和访问数据的属性建立关系
>
> **注意：考虑到effect可能是嵌套的结构，当里面的effect执行完成时需要将activeEffect的进行修正，否则可能导致收集的依赖出错， 这里里面的函数执行完弹出，类似栈的特性，所以使用一个栈的结构去存所有的effect，这样即使有嵌套的effect存在，当里层的执行完成后将栈顶弹出，activeEffect指向最后的一项即是正在执行的effect，从而确保依赖收集正确**

### effect的代码实现

```javascript
export function effect(fn, options: any = {}) {
  const effect = createEffect(fn, options);

  if (!options.lazy) {
    effect();
  }

  return effect;
}
let activeEffect,
  effectStack = [],
  uid = 0;

function createEffect(fn, options) {
  const effect = () => {
    try {
      activeEffect = effect;
      effectStack.push(activeEffect);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };

  effect.options = options;
  effect.uid = uid++;
  effect.fn = fn;

  return effect;
}
```

### track和trigger的代码实现

```javascript
let targetMap = new WeakMap();

// 收集
export function track(target, type, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  if (activeEffect) {
    deps.add(activeEffect);
  }
}
// 触发更新
export function trigger(target, type, key, value?, oldValue?) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = depsMap.get(key);

  const effects = new Set();

  function add(deps) {
    if (deps) {
      deps.forEach(effect => effects.add(effect));
    }
  }

  if (key !== undefined) {
    add(deps);
    switch (type) {
      case TriggerOperator.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'));
        }
    }
  }

  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler();
    } else {
      effect();
    }
  });
}
```

## ref

### ref产生的理由

1. ref可以对原始值定义响应式，因为原始值是没办法进行和依赖的收集的，这样导致模板下次更新时检测不到的，最好的办法是转化成对象的形式，但是使用的时候需要通过.value的方式去使用，后续vue可能能够通过编译器让我们写代码时也可以不使用.value就可以进行使用，例子如下：

   ```javascript
   setup() {
      let name = ref("")
      
      setTimeout(() => {
        name.value = '张三'  
      },1000)
      
      return {
          name
      }
   }
   ```

2. 我们通常使用reactive定义响应式数据，但是使用的时候进行结构了，结构的数据是没办法保证具备响应式的，这时可以通过toRef和toRefs将某个属性或者整个对象变成响应式

   ```java
   setup() {
   	let obj = reactive({
       	name: "张三"
   	})
        return {
           ...toRefs(obj)
       }
   }
   ```

### ref的代码实现

```javascript
unction toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

class RefImpl {
  public __is_ref = true;
  public _value;
  constructor(value, public _shallow = false) {
    this._value = this._shallow ? value : toReactive(value);
  }
  get value() {
    track(this, TrackOperator.GET, 'value');
    return this._value;
  }
  set value(newValue) {
    let oldValue = this._value;
    if (hadChanged(newValue, oldValue)) {
      this._value = this._shallow ? newValue : toReactive(newValue);
      trigger(this, TriggerOperator.SET, 'value', this._value, oldValue);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function shallowRef(value) {
  return new RefImpl(value, true);
}
```

### toRef和toRefs

```javascript
class ObjectRefImpl {
  public __is_ref = true;
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    let oldValue = this.target[this.key];
    if (hadChanged(newValue, oldValue)) {
      this.target[this.key] = newValue;
    }
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(target) {
  if (!isObject(target)) {
    return target;
  }

  let res = isArray(target) ? [] : {};
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      res[key] = toRef(target, key);
    }
  }

  return res;
}
```

## computed

1. computed的参数可以是一个函数或者可以是一个对象， 如果是函数则只有取值的功能，设置值是会报警告
2. computed模式是lazy的，不会立即执行，只有到取值时才执行
3. computed的实现依赖了effect，里面是一个比较巧妙地设计，computed定义了一个effect，effect的函数是用户自己定义的get函数，set是用户自己定义的或者默认赋值的，对computed的value进行依赖收集，触发更新其实发生在当computed依赖的值发生变化时，所以effect又定义了自己的scheduler的逻辑，当computed依赖的原始数据变化时去执行scheduler的函数，里面实现了相应的更新操作

### computed代码实现

```javascript
class ComputedRefImpl {
  public __is_ref = true;
  public _value;
  public effect;
  public _dirty = true;

  constructor(getter, public setter) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        // trigger
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, TriggerOperator.SET, 'value');
        }
      },
    });
  }

  get value() {
    // track
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
    }
    track(this, TrackOperator.GET, 'value');
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = value => {
      console.warn('readonly value can not be set');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
```









