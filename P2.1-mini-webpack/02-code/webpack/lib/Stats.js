class Stats {
  constructor(compilation) {
    // 入口
    this.entries = compilation.entries;
    // 模块
    this.modules = compilation.modules;
    //代码块
    this.chunks = compilation.chunks;
    //文件名数组
    this.files = compilation.files;
  }

  toJson() {
    return this;
  }

}

module.exports = Stats;
