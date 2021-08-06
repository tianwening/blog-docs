# 发布-订阅模式

```js
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(topic, cb) {
    this.events[topic] || (this.events[topic] = new Set());
    this.events[topic].add(cb);
  }

  emit(topic, info) {
    if (this.events[topic]) {
      this.events[topic].forEach(cb => cb(info));
    }
  }

  off(topic, fn) {
    if (this.events[topic]) {
      if (this.events[topic].has(fn)) {
        this.events[topic].delete(fn);
      }
    }
  }

  once(topic, fn) {
    const cb = (...args) => {
      cb.fn(...args);
      this.off(topic, cb);
    };
    cb.fn = fn;
    this.on(topic, cb);
  }
}

let event = new EventEmitter();

function a(info) {
  console.log('a', info);
}

event.on('世界杯', a);

event.once('世界杯', function(info) {
  console.log('小明', info);
});

event.emit('世界杯', '开始了');

event.emit('世界杯', '开始了');

```

