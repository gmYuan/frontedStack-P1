#!/usr/bin/env node

const commander = require('commander')
const pkg = require('../package.json')

// 使用方法1：内置的单例对象 使用
// const { program } = commander

// program
//   .version(pkg.version)
//   .parse(process.argv)

// 使用方法2：新建一个 program对象
const program = new commander.Command()

program
  .name(Object.keys(pkg.bin)[0])
  .usage('<command> [options]')
  .version(pkg.version)
  .option('-d, --debug', '是否开启调试模式', false)
  .option('-e, --env <envName>', '获取环境变量名称')

// 获取解析后的选项值
// const options = program.opts(); 
// console.log(options.debug)
// console.log(options.env)

// program.outputHelp()


// 其他常用特性

// 1 注册主命令
const clone = program.command('clone <source> [destination]')
clone
  .description('clone a repository')
  .option('-f, --force', '是否强制克隆')
  .action((source, destination, cmdObj) => {
    console.log('do clone---', source, destination, cmdObj)
  })


// 2 注册 子命令
const service = new commander.Command('service')

// 定义 service start 子命令
service.command('start <port>')
  .description('start a service at some port')
  .action(port => {
    console.log('do service start---', port)
  })

// 定义 service stop 子命令
service.command('stop')
  .description('stop a service')
  .action(() => {
    console.log('do service stop##')
  })

// 添加 service 子命令
program.addCommand(service)


// 4 program.command('cmd [desc]'): 独立命令
// 如果不传第二个参数，则被视为内联命令，必须提供 .action() 处理函数, 如上面的clone
// 如果传入字符串作为第二个参数（描述），则被视为 独立可执行命令

program.command('install [package]', 'install a package', {
  // 应该指向一个实际存在的可执行文件，不能是命令
  executableFile: './index-yargs.js',
  // 是否为默认命令, 如果为true，则可以省略命令直接执行
  isDefault: true,
  // 是否在 help 信息中 隐藏该命令
  hidden: false,
})
  .alias('i')



// 3 捕获未被识别的命令，并 提供默认行为
program.arguments('<cmd> [options]')
  .description('未定义的 command部分', {
    cmd: 'command to run',
    options: 'options for the command'
  })
  .action((cmd, options) => {
    console.log('unknown command action---', cmd, options)
  })




// 解析命令行参数
program.parse(process.argv)



