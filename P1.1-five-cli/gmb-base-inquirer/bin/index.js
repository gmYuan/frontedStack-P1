#!/usr/bin/env node

const inquirer = require("inquirer").default;

// 基础使用1：input + number
// inquirer
//   .prompt([
//     {
//       type: "input",
//       name: "name",
//       message: "What is your name?",
//       validate: (value) => {
//         return typeof value === "string";
//       },
//       // 用于在用户输入时 实时转换输入的内容
//       // 不会改变实际存储的值，只改变显示的内容
//       // 可以用来添加前缀、后缀，或者进行其他格式化
//       // 这个功能对于提升用户体验很有帮助，因为它可以在用户输入的同时提供即时的视觉反馈
//       transformer: (value) => {
//         // 添加前缀
//         return `👤 ${value}`;
//       },
//       // 主要作用：
//       // 在用户完成输入后，对输入的值进行转换
//       // 转换后的值会被实际存储到结果中
//       // 只执行一次，在用户完成输入后执行
//       // 一般用于 数据标准化、格式转换、数据验证和清理
//       filter: (val) => {
//         return `name[${val}]`;
//       },
//     },
//     {
//       type: "number",
//       name: "age",
//       message: "How old are you?",
//     }
//   ])
//   .then((answers) => {
//     console.log("answers-", answers);
//   })
//   .catch((error) => {
//     console.error("error-", error);
//   });

// -----------------------------------------
// 基础使用2：list & expand
// inquirer.prompt([
//   {
//     type: "expand",
//       name: "color",
//       message: "What is your favorite color?",
//       default: "r",
//       choices: [
//         {
//           key: "r",
//           name: "red",
//           value: 1,
//         },
//         {
//           key: "b",
//           name: "blue",
//           value: 2,
//         },
//         {
//           key: "g",
//           name: "green",
//           value: 3,
//         },
//       ],
//     },
//   ])
//   .then((answers) => {
//     console.log("answers-", answers);
//   })
//   .catch((error) => {
//     console.error("error-", error);
//   });


// -----------------------------------------
// 基础使用3：password
// inquirer.prompt([
//   {
//     type: "password",
//     name: "password",
//     message: "What is your password?",
//     // mask: "*",
//   },
// ])
//   .then((answers) => {
//     console.log("answers-", answers);
//   })
//   .catch((error) => {
//     console.error("error-", error);
//   });


// -----------------------------------------
// readline 基本使用

const readline = require("./readline-use");