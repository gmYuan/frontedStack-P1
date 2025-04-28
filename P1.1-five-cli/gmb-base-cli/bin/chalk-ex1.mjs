#!/usr/bin/env node

import chalk, { Chalk } from "chalk";

console.log(chalk.red("Hello world!"));

// 支持链式调用1
console.log(chalk.red.bgGreen.bold("Hello world2"));

// 支持链式调用2
console.log(chalk.rgb(255, 0, 0).underline("hello world3"));

console.log(chalk.hex("#ff0000").bold("hello world4"));

// 支持拼接调用1
console.log(chalk.red("hello,", "world5"));

// 支持拼接调用2
console.log(chalk.red("hello", chalk.underline("world6")));


// -----------------------------------------
// 函数调用
const logErr = (...text) => {
  console.log(chalk.bold.hex("#ff0000")(text));
};

const logWarn = (...text) => {
  console.log(chalk.hex("#ffa500")(text));
};

logErr("is Error");
logWarn("is Warning");


// -----------------------------------------
// 自定义chalk
const chalkIns = new Chalk({
  level: 1,
});

console.log(chalkIns.blue("hello world"));
