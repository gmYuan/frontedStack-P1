#!/usr/bin/env node

// 红色前景色
// console.log('\x1B[31m%s', 'Your name:')

// 红色背景色
// console.log('\x1B[41m%s', 'Your name:')

// 红色背景色 + 下划线
console.log('\x1B[41m\x1B[4m%s', '你的名字是：')

// 光标下移2行
console.log('\x1B[2B%s', '你的名字2是：')

// 光标右移10格
console.log('\x1B[10C%s', '你的名字3是：')






