let { Tapable, SyncHook } = require("tapable");
const path = require("path");
let async = require("neo-async");

const NormalModuleFactory = require("./NormalModuleFactory");
const normalModuleFactory = new NormalModuleFactory();
const Parser = require("./Parser");
const parser = new Parser();

const Chunk = require("./Chunk");

const ejs = require("ejs");
const fs = require("fs");
// 创建 main.ejs
// const mainTemplate = fs.readFileSync(
//   // path.join(__dirname, "templates", "deferMain.ejs"),
//   path.join(__dirname, "templates", "main.ejs"),
//   "utf8"
// );
// const mainRender = ejs.compile(mainTemplate);

// 创建支持异步导入的 asyncMain.ejs
const asyncMainTemplate = fs.readFileSync(
  path.join(__dirname, "templates", "asyncMain.ejs"),
  "utf8"
);
const mainRender = ejs.compile(asyncMainTemplate);

// 创建 chunk.ejs
const chunkTemplate = fs.readFileSync(
  path.join(__dirname, "templates", "chunk.ejs"),
  "utf8"
);
const chunkRender = ejs.compile(chunkTemplate);


// Compilation类
class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.options = compiler.options; // 选项一样
    this.context = compiler.context; // 根目录
    this.inputFileSystem = compiler.inputFileSystem; // 读取文件模块fs
    this.outputFileSystem = compiler.outputFileSystem; // 写入文件的模块fs

    // 入口模块的数组,这里放着所有的入口模块
    this.entries = [];
    // 模块的数组,这里放着所有的模块
    this.modules = [];
    // key是模块ID, 值是模块对象
    this._modules = {};
    //这里放着所有代码块
    this.chunks = [];

    // 这里放着本次编译所有的产出的文件名
    this.files = [];

    // 存放着生成资源 key是文件名 值是文件的内容
    this.assets = {};

    // 放着所有的第三方模块 isarray
    this.vendors = [];
    // 这里放着同时被多个代码块加载的模块  title.js
    this.commons = [];

    this.hooks = {
      //当你成功构建完成一个模块后，就会触发此钩子执行
      succeedModule: new SyncHook(["module"]),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(),
    };
  }

  /**
   * 开始编译一个新的入口
   * @param {*} context  根目录
   * @param {*} entry 入口模块的相对路径 ./src/index.js
   * @param {*} name 入口的名字 main
   * @param {*} callback 所有模块都被编译完成 的回调
   */
  addEntry(context, entry, name, finalCallback) {
    this._addModuleChain(context, entry, name, false, (err, module) => {
      // console.log('addEntry完成');
      finalCallback(err, module);
    });
  }

  _addModuleChain(context, rawRequest, name, async, callback) {
    this.createModule(
      {
        name,
        context,
        rawRequest,
        parser,
        resource: path.posix.join(context, rawRequest),
        moduleId:
          "./" +
          path.posix.relative(context, path.posix.join(context, rawRequest)),
        async,
      },
      (entryModule) => this.entries.push(entryModule),
      callback
    );
  }

  /**
   * 创建并编译一个模块
   * @param {*} data 要编译的模块信息
   * @param {*} addEntry  可选的增加入口的方法：如果这个模块是入口模块,如果不是的话,就什么不做
   * @param {*} callback 编译完成后可以调用callback回调
   */
  createModule(data, addEntry, callback) {
    //通过模块工厂创建一个模块
    let module = normalModuleFactory.create(data);
    //如果是入口模块,则添加入口里去
    addEntry && addEntry(module);

    //给普通模块数组添加一个模块
    this.modules.push(module);
    this._modules[module.moduleId] = module;

    // 递归 编译依赖的模块
    const afterBuild = (err, module) => {
      //如果大于0,说明有依赖
      if (module.dependencies.length > 0) {
        this.processModuleDependencies(module, (err) => {
          callback(err, module);
        });
      } else {
        callback(err, module);
      }
    };

    // 编译模块
    this.buildModule(module, afterBuild);
  }

  /**
   * 处理/编译 模块依赖
   * @param {*} module ./src/index.js
   * @param {*} callback
   */
  processModuleDependencies(module, callback) {
    //1.获取当前模块的依赖模块
    let dependencies = module.dependencies;
    //遍历依赖模块,全部开始编译, 当所有的依赖模块全部编译完成后 才调用callback
    // 异步任务同时开始，全部执行完成，才会执行callback
    async.forEach(
      dependencies,
      // 每个任务的 具体执行逻辑： 对每个依赖模块 进行编译
      (dependency, done) => {
        let { name, context, rawRequest, resource, moduleId } = dependency;
        this.createModule(
          {
            name,
            context,
            rawRequest,
            parser,
            resource,
            moduleId,
          },
          null,
          done
        );
      },
      // 全部任务完成后的 回调
      callback
    );
  }

  /**
   * 编译模块
   * @param {*} module 要编译的模块
   * @param {*} afterBuild 编译完成后的后的回调
   */
  buildModule(module, afterBuild) {
    // 模块的真正的编译逻辑，其实是 放在module内部完成
    module.build(this, (err) => {
      //走到这里意味着，一个module模块 已经编译完成了
      this.hooks.succeedModule.call(module);
      afterBuild(err, module);
    });
  }

  /**
   * 把模块封装成代码块Chunk
   * @param {*} callback
   */
  seal(callback) {
    this.hooks.seal.call();
    // 开始准备生成代码块
    this.hooks.beforeChunks.call();

    debugger;

    // 一般来说,默认情况下,每一个入口会生成一个代码块
    for (const entryModule of this.entries) {
      //根据入口模块, 得到一个代码块
      const chunk = new Chunk(entryModule);
      this.chunks.push(chunk);
      //对所有模块进行过滤,找出来那些名称跟这个chunk一样的模块,组成一个数组 赋给chunk.modules
      chunk.modules = this.modules.filter(
        (module) => module.name === chunk.name
      );
    }

    // console.log(this.chunks);

    this.hooks.afterChunks.call(this.chunks);
    //生成代码块之后,要生成代码块对应资源
    this.createChunkAssets();
    callback();
  }

  createChunkAssets() {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      //只是拿到了文件名
      const file = chunk.name + ".js";
      chunk.files.push(file);
      let source;
      // 异步代码块
      if (chunk.async) {
        source = chunkRender({
          chunkName: chunk.name, // ./src/index.js
          modules: chunk.modules, //此代码块对应的模块数组[{moduleId:'./src/index.js'},{moduleId:'./src/title.js'}]
        });
      } else {
        // 同步代码块
        let deferredChunks = [];
        if (this.vendors.length > 0) deferredChunks.push("vendors");
        if (this.commons.length > 0) deferredChunks.push("commons");
        source = mainRender({
          // 入口模块的ID
          entryModuleId: chunk.entryModule.moduleId,
          // 延迟加载的代码块
          deferredChunks,
          // 此代码块对应的模块数组[{moduleId:'./src/index.js'},{moduleId:'./src/title.js'}]
          modules: chunk.modules,
        });
      }

      this.emitAssets(file, source);
    }
  }

  emitAssets(file, source) {
    this.assets[file] = source;
    this.files.push(file);
  }
}

module.exports = Compilation;
