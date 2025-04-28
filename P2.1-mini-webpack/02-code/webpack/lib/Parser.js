const babylon = require("babylon");
const { Tapable } = require("tapable");

class Parser extends Tapable {
  parse(source) {
    return babylon.parse(source, {
      //源代码是一个模块
      sourceType: "module",
      //额外一个插件,支持动态导入 import('./title.js');
      plugins: ["dynamicImport"],
    });
  }

  traverse() {}
}

module.exports = Parser;
