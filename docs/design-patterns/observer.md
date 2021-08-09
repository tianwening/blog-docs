# 观察者模式

```js
class Subject {
  constructor(status) {
    this.status = status;
    this.observers = new Set();
  }
  change(status) {
    let oldStatus = this.status;
    if (oldStatus !== status) {
      this.status = status;
      this.notify(oldStatus);
    }
  }
  addObserver(o) {
    this.observers.add(o);
  }
  notify(oldStatus) {
    this.observers.forEach(o => o.update(this.status, oldStatus));
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }
  update(status, oldStatus) {
    console.log(
      `观察者${this.name},收到消息，被观察者状态改变了， 之前的状态是${oldStatus}，当前的状态是${status}`
    );
  }
}

let s = new Subject('身体好着呢');
let o1 = new Observer('小明');
let o2 = new Observer('小张');

s.addObserver(o1);
s.addObserver(o2);

s.change('现在生病了');

```

![image-20210806112513998](https://cdn.tianwening.top/images/image-20210806112513998.png)