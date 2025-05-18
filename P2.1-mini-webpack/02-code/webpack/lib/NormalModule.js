const path = require("path");
const types = require("babel-types");
const generate = require("babel-generator").default;
const traverse = require("babel-traverse").default;
const async = require("neo-async");
// const { runLoaders } = require("./loader-runner");

class NormalModule {
  constructor({
    name,
    context,
    rawRequest,
    resource,
    parser,
    moduleId,
    async,
  }) {
    // 这里的name，一开始是webpack.config.js 的 entry 的 key 值: main
    this.name = name;
    this.context = context;
    // 一开始是 webpack.config.js 的 entry 的 value 值:  ./src/index.js
    this.rawRequest = rawRequest;
    // 这是这个模块的绝对路径: /xxx/src/index.js
    this.resource = resource;

    //这是AST解析器, 可以把源代码 转成 AST抽象语法树
    this.parser = parser;
    //此模块对应的源代码
    this._source;
    //此模块对应的AST抽象语法树
    this._ast;

    //当前模块依赖的模块信息
    this.dependencies = [];

    // 模块的ID
    this.moduleId = moduleId || "./" + path.posix.relative(context, resource);

    // 当前模块依赖哪些异步模块 import(那些模块)
    this.blocks = [];
    // 表示当前的模块是属于一个异步代码块, 还是一个同步代码块
    this.async = async;
  }

  /**
   * 编译本模块
   * @param {*} compilation
   * @param {*} callback
   */
  build(compilation, callback) {
    this.doBuild(compilation, (err) => {
      // 实现思路：
      // 1. 得到语法树
      // 2. 遍历语法树,找到里面的依赖，进行收集依赖
      // 3. 把转换后的语法树，重新生成源代码
      // 4. 循环构建每一个异步代码块, 都构建完成才会代表 当前的模块编译完成

      // 得到语法树
      this._ast = this.parser.parse(this._source);

      //遍历语法树,找到里面的依赖进行收集依赖
      traverse(this._ast, {
        //当遍历到CallExpression 导入语句节点的时候, 就会进入回调
        CallExpression: (nodePath) => {
          //获取节点
          let node = nodePath.node;
          // 如果方法名是require方法的话
          if (node.callee.name === "require") {
            //1. 把方法名用require改成了 __webpack_require__
            node.callee.name = "__webpack_require__";
            // 获取模块的名称
            let moduleName = node.arguments[0].value;
            // 依赖的绝对路径
            let depResource;

            // 如果模块的名字是以.开头,说明是一个本地模块,或者说用户自定义模块
            if (moduleName.startsWith(".")) {
              //2.获得可能的扩展名
              let extName =
                moduleName.split(path.posix.sep).pop().indexOf(".") == -1
                  ? ".js"
                  : "";
              //3.获取依赖模块(./src/title.js)的绝对路径 win \ linux /
              // /project/src/title.js
              depResource = path.posix.join(
                path.posix.dirname(this.resource),
                moduleName + extName
              );
            } else {
              //否则是一个第三方模块,也就是放在node_modules里的
              //C:\xxx....\node_modules\isarray\index.js
              depResource = require.resolve(
                path.posix.join(this.context, "node_modules", moduleName)
              );
              depResource = depResource.replace(/\\/g, "/"); //把window里的 \转成 /
            }

            // 4.依赖的模块ID  ./ + 从根目录出发到依赖模块的绝对路径 的相对路径
            //let depModuleId = './' + path.posix.relative(this.context,depResource);
            // depResource= /project/node_modules/isarray/index.js
            // this.context /project/  
            // ./node_modules/isarray/index.js
            let depModuleId = "." + depResource.slice(this.context.length);
            // console.log("depModuleId---", depModuleId);

            // 替换成__webpack_require__ 后，
            // 也需要把 require模块路径从./title.js 变成 ./src/title.js
            node.arguments = [types.stringLiteral(depModuleId)];

            // console.log("node--", node);

            this.dependencies.push({
              name: this.name, //main
              context: this.context, //根目录
              rawRequest: moduleName, //模块的相对路径 原始路径
              moduleId: depModuleId, //模块ID 它是一个相对于根目录的相对路径,以./开头
              resource: depResource, //依赖模块的 绝对路径
            });
            // console.log("this.dependencies---", this.dependencies);
          } else if (types.isImport(node.callee)) {
            // 支持动态导入/ import懒加载
            // 判断这个节点CallExpression 它的callee是不是import类型

            // 1. 获取模块的名称
            let moduleName = node.arguments[0].value;

            // 2. 获取可能的扩展名
            let extName =
              moduleName.split(path.posix.sep).pop().indexOf(".") == -1
                ? ".js"
                : "";
            // 3. 获取依赖的模块的绝对路径
            let depResource = path.posix.join(
              path.posix.dirname(this.resource),
              moduleName + extName
            );
            // 4. 获取依赖的模块ID ./+从根目录出发到依赖模块的绝对路径的相对路径 ./src/title.js
            let depModuleId =
              "./" + path.posix.relative(this.context, depResource);

            // 5. 获取异步代码块的 chunkName名称
            let chunkName = "0";
            if (
              Array.isArray(node.arguments[0].leadingComments) &&
              node.arguments[0].leadingComments.length > 0
            ) {
              // webpackChunkName: 'title'
              let leadingComments = node.arguments[0].leadingComments[0].value;
              let regexp = /webpackChunkName:\s*['"]([^'"]+)['"]/;
              chunkName = leadingComments.match(regexp)[1];
            }

            // 6. 用__webpack_require__.e 和 __webpack_require__.t
            // 替换 动态导入的语句
            nodePath.replaceWithSourceString(
              `__webpack_require__.e("${chunkName}").then(__webpack_require__.t.bind(null,"${depModuleId}", 7))`
            );

            // 7. 存入 异步代码块的依赖
            this.blocks.push({
              context: this.context,
              entry: depModuleId,
              name: chunkName,
              async: true, // 异步的代码块
            });
          }
        },
      });

      //把转换后的语法树 重新生成源代码
      let { code } = generate(this._ast);
      this._source = code;
      // callback();

      //循环构建每一个异步代码块, 都构建完成 才会代表当前的模块编译完成
      async.forEach(
        this.blocks,
        (block, done) => {
          let { context, entry, name, async } = block;
          compilation._addModuleChain(context, entry, name, async, done);
        },
        callback
      );
    });
  }

  /**
   * 1.读取模块的源代码
   * @param {*} compilation
   * @param {*} callback
   */
  doBuild(compilation, callback) {
    this.getSource(compilation, (err, source) => {
      if (err) {
        console.log("err是------", err);
      }
      this._source = source;
      callback();
    });
  }

  /**
   * 读取真正的源代码
   */
  getSource(compilation, callback) {
    // fs.readFile读文件
    compilation.inputFileSystem.readFile(this.resource, "utf8", callback);
  }
}

module.exports = NormalModule;

/**
module.build 的 实现思路
 1. 从硬盘上把模块内容读出来,读成一个文本

 2. 可能它不是一个JS模块,所以会可能要走loader的转换,最终肯定要得到一个JS模块代码,得不到就报错了

 3. 把这个JS模块代码经过parser处理，转成抽象语法树AST

 4. 分析AST里面的依赖,也就是找 require/import节点, 分析依赖的模块

 5. 递归的 编译依赖的模块

 6. 不停的依次递归 执行上面5步,直到所有的模块都 编译完成为止
 
 */

/**
 * 非常的重要的问题
 * 模块的ID的问题
 * 不管你是相对的本地模 块,还是三方模块
 * 最后它的moduleId 全部都一个相对相对于项目根目录相对路径
 * ./src/title.js
 * ./src/index.js
 * ./node_modules/util/util.js
 * 路径分隔符一定是linux /,而非window里的\
 */

/**
 * 如何处理懒加载
 * 1.先把代码转成AST语法树
 * 2.找出动态import节点
 */
