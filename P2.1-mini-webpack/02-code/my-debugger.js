const webpack = require("./webpack");
const webpackOptions = require("./webpack.config.js");

// debugger;

const compiler = webpack(webpackOptions);

compiler.run((err = null, stats) => {
  err && console.log(err);
  // console.log(stats.toJson({
  //   entries: true,
  //   modules: true,
  //   chunks: true,
  //   files: true,
  //   assets: true,
    
  //   // _modules:true,
  //   // assets:true,    
  // }));
  console.log('All done！')
});