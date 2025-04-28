#!/usr/bin/env node

const lib = require("gmb-base-cli-lib");
const argv = process.argv;

console.log("argv是", argv);

const subCommand = argv[2];
const restArgs = argv.slice(3);

// v1.1 支持识别子命令 + 选项
// 这里只是最简单的情况，忽略了可能还有 子命令 + 参数/ 多选项 的情况
// let [option, flag] = restArgs
// option = option.replace(/--/, '')

// if (subCommand) {
//   if (lib[subCommand]) {
//     lib[subCommand]({option, flag})
//   } else {
//     console.log('无效的子命令')
//   }
// } else {
//   console.log('请输入子命令')
// }

// v1.2 支持识别 无子命令的情况
if (restArgs.length >= 1) {
  let [option, flag] = restArgs;
  option = option.replace(/--/, "");
  if (subCommand) {
    if (lib[subCommand]) {
      lib[subCommand]({ option, flag });
    } else {
      console.log("无效的子命令");
    }
  } else {
    console.log("请输入子命令");
  }
}

if (subCommand.startsWith('-') || subCommand.startsWith('--')) {
  const globalOption = subCommand.replace(/--|-/g, '')
  console.log('globalOption是', globalOption)
  if (globalOption === 'version' || globalOption === 'V') {
    console.log('当前版本是 1.0.0')
  }
}
