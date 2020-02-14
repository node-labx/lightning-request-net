class Pool {
  get defaultOptions() {
    return {
      min: 100,
    };
  }

  constructor(factory, options = {}) {
    this.factory = factory;
    this.options = Object.assign(this.defaultOptions, options);
    this.resources = [];
    this.init();
  }

  init() {
    const min = this.options.min;
    for (let i = 0; i < min; i++) {
      this.resources.push(this.factory.create());
    }
  }

  acquire() {
    if (this.resources.length === 0) {
      return this.factory.create();
    }
    return this.resources.pop();
  }

  release(resource) {
    this.resources.push(resource);
  }
}

module.exports = Pool;
