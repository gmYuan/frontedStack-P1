const path = require("path");
module.exports = {
  context: path.resolve(__dirname), //当前的工作目录
  mode: "development",
  // entry:'./src/index.js',
  entry: {
    page1: "./src/page1.js",
    page2: "./src/page2.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    chunkFilename: "[name].js",
  },
};
