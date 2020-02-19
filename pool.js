class Pool {
  get defaultOptions() {
    return {
      initialValue: 10,
    };
  }

  constructor(factory, options = {}) {
    this.factory = factory;
    this.options = Object.assign(this.defaultOptions, options);
    this.resources = [];
    this.init();
  }

  init() {
    const initialValue = this.options.initialValue;
    for (let i = 0; i < initialValue; i++) {
      this.resources.push(this.factory.create());
    }
  }

  acquire() {
    if (this.resources.length === 0) {
      return this.factory.create();
    }
    const conn = this.resources.pop();
    // 判断该连接是否已销毁，如果已销毁，则重新申请，直到申请到一个未销毁的连接
    if (!conn.destroyed) {
      return conn;
    } else {
      return this.acquire();
    }
  }

  release(resource) {
    this.resources.push(resource);
  }
}

module.exports = Pool;
