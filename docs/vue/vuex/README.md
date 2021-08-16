# vuex学习

## vuex是什么？

> Vuex 是一个专为 Vue.js 应用程序开发的**状态管理模式**。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

## vuex4的学习实现

### createStore和useStore

1. vuex4与之前的版本通过new Vuex.Store(options)来创建的方式不同， 它提供了两个函数，createStore用以创建一个存储仓库store，useStore可以在组件中进行使用

   ```js
   import Store from './store';
   import { useStore } from './injectKey';
   
   function createStore(options) {
     return new Store(options);
   }
   
   export { createStore, useStore };
   ```

2. createStore创建了一个Store的实例，useStore则是通过vue3提供的inject函数进行示例的注入，其中Store的实例上面提供有安装(install)的方法，当通过createApp创建出vue实例后，可以通过app.use(store)的方式将store实例注册进去。

   - Store的实现如下：

   ```js
   import { injectKey } from './injectKey';
   import { reactive } from 'vue';
   import ModuleCollection from './modules/moduleCollection';
   import { forEachValue, isPromise } from './utils';
   function getNestedState(rootState, path) {
     return path.reduce((state, key) => state[key], rootState);
   }
   
   function installModule(store, rootState, path, module) {
     let isRoot = !path.length;
     let namespaced = store._modules.getNamespaced(path);
   
     if (!isRoot) {
       let parent = path.slice(0, -1).reduce((state, key) => {
         return state[key];
       }, rootState);
       parent[path[path.length - 1]] = module.state;
     }
   
     module.forEachGetters((getter, key) => {
       store._wrappedGetters[namespaced + key] = () => getter(getNestedState(store._state.data, path));
     });
   
     module.forEachMutations((mutation, key) => {
       let entry = store._mutations[namespaced + key] || (store._mutations[namespaced + key] = []);
       entry.push(payload => {
         mutation.call(store, getNestedState(store._state.data, path), payload);
       });
     });
   
     module.forEachActions((action, key) => {
       let entry = store._actions[namespaced + key] || (store._actions[namespaced + key] = []);
       entry.push(payload => {
         let res = action.call(store, store, payload);
         if (!isPromise(res)) {
           return Promise.resolve(res);
         }
         return res;
       });
     });
   
     if (module.children) {
       module.forEachChild((childModule, key) => {
         installModule(store, rootState, path.concat(key), childModule);
       });
     }
   }
   
   function resetStoreState(store, rootState) {
     store._state = reactive({
       data: rootState,
     });
   
     store.getters = {};
   
     forEachValue(store._wrappedGetters, (getter, key) => {
       Object.defineProperty(store.getters, key, {
         enumerable: true,
         get: getter,
       });
     });
   }
   
   class Store {
     constructor(options) {
       let store = this;
       this._modules = new ModuleCollection(options);
       let rootState = this._modules.root.state;
   
       this._wrappedGetters = Object.create(null);
       this._mutations = Object.create(null);
       this._actions = Object.create(null);
       this.observers = [];
   
       installModule(store, rootState, [], this._modules.root);
   
       resetStoreState(store, rootState);
   
       options.plugins &&
         options.plugins.forEach(plugin => {
           plugin(store);
         });
     }
   
     subscribe(cb) {
       this.observers.push(cb);
     }
   
     replaceState(state) {
       this._state.data = state;
     }
   
     commit = (key, payload) => {
       let entry = this._mutations[key] || [];
       entry.forEach(mutation => {
         mutation(payload);
       });
       this.observers.forEach(cb => cb(this));
     };
   
     dispatch = (key, payload) => {
       let entry = this._actions[key] || [];
       return Promise.all(entry.map(handler => handler(payload)));
     };
   
     get state() {
       return this._state.data;
     }
   
     install(app, storeKey = null) {
       app.provide(storeKey === null ? injectKey : storeKey, this);
       app.config.globalProperties.$store = this;
     }
   }
   
   export default Store;
   ```

   - useStore实现如下：

     ```js
     import { inject } from 'vue';
     export const injectKey = 'store';
     
     export function useStore(storeKey = null) {
       return inject(storeKey === null ? injectKey : storeKey);
     }
     ```

### Module和ModuleCollection

1. Store的实现依赖于Module和ModuleCollection，其中，module表示根据用户配置创建的一个个的module实例，而moudleCollection是负责将moudle按照父子关系串联到一起形成一个树的结构，以便进行module的查找、添加之类的操作

   - module类的实现如下：

     ```js
     import { forEachValue } from '../utils';
     class Module {
       constructor(rawModule) {
         this.raw = rawModule;
         this.state = rawModule.state;
         this.children = {};
         this.namespaced = rawModule.namespaced || false;
       }
       addChild(name, module) {
         this.children[name] = module;
       }
       getChild(name) {
         return this.children[name];
       }
       forEachChild(cb) {
         forEachValue(this.children, cb);
       }
       forEachGetters(cb) {
         if (this.raw.getters) {
           forEachValue(this.raw.getters, cb);
         }
       }
       forEachMutations(cb) {
         if (this.raw.mutations) {
           forEachValue(this.raw.mutations, cb);
         }
       }
       forEachActions(cb) {
         if (this.raw.actions) {
           forEachValue(this.raw.actions, cb);
         }
       }
     }
     
     export default Module;
     ```

   - moduleCollection类的实现：

     ```js
     import Module from './module';
     import { forEachValue } from '../utils';
     class ModuleCollection {
       constructor(rootModule) {
         this.root = null;
         this.register(rootModule, []);
       }
       register(module, path) {
         // [aModule]
         let newModule = new Module(module);
         // path长度为0表示是一个跟模块
         if (path.length === 0) {
           this.root = newModule;
         } else {
           let parent = path.slice(0, -1).reduce((module, key) => {
             return module.getChild(key);
           }, this.root);
           parent.addChild(path[path.length - 1], newModule);
         }
     
         if (module.modules) {
           forEachValue(module.modules, (value, key) => {
             this.register(value, path.concat(key));
           });
         }
       }
     
       getNamespaced(path) {
         let module = this.root;
         return path.reduce((namespaceStr, key) => {
           module = module.getChild(key);
           namespaceStr += module.namespaced ? key + '/' : '';
           return namespaceStr;
         }, '');
       }
     }
     
     // {
     //   root: {
     //     rawModule: rawModule,
     //     state: rawModule.state,
     //     children: {
     //       aModule: {
     //         rawModule: rawModule,
     //         state: rawModule.state,
     //       }
     //     }
     //   }
     // }
     
     export default ModuleCollection;
     ```

   ### utils

   上面的具体实现中涉及一些工具方法的使用，具体实现如下：

   ```js
   export const forEachValue = (items, cb) => {
     Object.keys(items).forEach(key => cb(items[key], key));
   };
   
   export const isPromise = value => typeof value === 'object' && typeof value.then === 'function';
   ```

   