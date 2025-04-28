const {
  Tapable,
  SyncBailHook,
  AsyncSeriesHook,
  SyncHook,
  AsyncParallelHook,
} = require("tapable");

let NormalModuleFactory = require("./NormalModuleFactory");

let Compilation = require("./Compilation");

const Stats = require("./Stats");

class Compiler extends Tapable {
  constructor(context) {
    super();
    this.context = context;
    this.hooks = {
      //context项目根目录的绝对路径 C:\aproject\zhufeng202009webpack\8.my
      //entry入口文件路径 ./src/index.js
      entryOption: new SyncBailHook(["context", "entry"]),
      //运行前
      beforeRun: new AsyncSeriesHook(["compiler"]),
      //运行
      run: new AsyncSeriesHook(["compiler"]),
      // 编译前
      beforeCompile: new AsyncSeriesHook(["params"]),
      // 编译
      compile: new SyncHook(["params"]),
      // make构建 TODO
      make: new AsyncParallelHook(["compilation"]),

      // 开始一次新的编译
      thisCompilation: new SyncHook(["compilation", "params"]),
      // 创建完成一个新的compilation
      compilation: new SyncHook(["compilation", "params"]),
      // 编译完成
      afterCompile: new AsyncSeriesHook(["compilation"]),

      //所有的编译全部都完成
      done: new AsyncSeriesHook(["stats"]),
    };
  }

  //run方法是开始编译的入口
  run(callback) {
    console.log("Compiler run");
    const onCompiled = (err, compilation) => {
      console.log("onCompiled");
      callback(err, new Stats(compilation));
    };
    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        this.compile(onCompiled);
      });
    });
  }

  compile(onCompiled) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, (err) => {
      this.hooks.compile.call(params);
      // 创建一个新compilation对象
      const compilation = this.newCompilation(params);

      // 触发make钩子的回调函数执行
      this.hooks.make.callAsync(compilation, (err) => {
        console.log("make完成");
        //封装代码块之后 编译就完成了
        compilation.seal((err) => {
          //触发编译完成的钩子
          this.hooks.afterCompile.callAsync(compilation, (err) => {
            onCompiled(err, compilation);
          });
        });
      });


    });
  }

  newCompilationParams() {
    const params = {
      //在创建compilation这前已经创建了一个普通模块工厂
      normalModuleFactory: new NormalModuleFactory(), //TODO
    };
    return params;
  }

  newCompilation(params) {
    const compilation = this.createCompilation();
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }

  createCompilation() {
    return new Compilation(this);
  }
}

module.exports = Compiler;
