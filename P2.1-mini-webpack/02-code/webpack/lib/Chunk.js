class Chunk {
  constructor(entryModule) {
    //此代码的入口模块
    this.entryModule = entryModule;
    //代码块的名称
    this.name = entryModule.name;
    //这个代码生成了哪些文件
    this.files = [];
    //这个代码块包含哪些模块
    this.modules = [];

    //是否是异步代码块
    // this.async = entryModule.async;
  }
}
module.exports = Chunk;
