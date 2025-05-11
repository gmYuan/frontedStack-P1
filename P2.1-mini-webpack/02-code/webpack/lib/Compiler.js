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

//递归的创建新的文件夹
const mkdirp = require("mkdirp");
const path = require("path");

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

      // 发射或者说写入
      emit: new AsyncSeriesHook(["compilation"]),

      //所有的编译全部都完成
      done: new AsyncSeriesHook(["stats"]),
    };
  }

  //run方法是开始编译的入口
  run(callback) {
    console.log("Compiler run");

    const onCompiled = (err, compilation) => {
      this.emitAssets(compilation, (err) => {
        console.log("onCompiled");
        //先收集编译信息 chunks entries modules files
        let stats = new Stats(compilation);
        // 再触发done这个钩子执行
        this.hooks.done.callAsync(stats, (err) => {
          callback(err, stats);
        });
      });
    };

    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        this.compile(onCompiled);
      });
    });
  }

  emitAssets(compilation, callback) {
    //把 chunk变成文件,写入硬盘
    const emitFiles = (err) => {
      const assets = compilation.assets;
      //dist
      let outputPath = this.options.output.path;
      for (let file in assets) {
        let source = assets[file];
        //是输出文件的绝对路径 C:\aproject\zhufeng202009webpack\8.my\dist\main.js
        let targetPath = path.posix.join(outputPath, file);
        this.outputFileSystem.writeFileSync(targetPath, source, "utf8");
      }
      callback();
    };
    //先触发emit的回调,在写插件的时候emit用的很多,因为它是我们修改输出内容的最后机会
    this.hooks.emit.callAsync(compilation, () => {
      //先创建输出目录dist, 再写入文件
      mkdirp(this.options.output.path, emitFiles);
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
