#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const arg = hideBin(process.argv)
// 初始化 yargs 实例，将处理过的命令行参数传递给它
const cli = yargs(arg)

cli
  .usage('Usage: gmb [command] <options>')
  .demandCommand(1, 'A command is required, Pass --help to see all available commands and options.')
  .strict()
  .recommendCommands()
  .fail((msg, err) => {
    console.log(msg)
  })
  .alias('h', 'help')
  .alias('v', 'version')
  .wrap(cli.terminalWidth())
  .epilogue(`When a dommand fails, all logs are written to lerna-debug.log`)
  .options({
    debug: {
      type: 'boolean',
      describe: 'Run with debug logging',
      alias: 'd',
    },
  })
  .option('registry', {
    type: 'string',
    describe: 'Default global registry',
    alias: 'r',
  })
  .group(['debug'], 'Dev Options')
  .group(['registry'], 'Extra Options')
  .command('init [name]', 'Init a project',
    (yargs) => {
      yargs.option('name', {
          type: 'string',
          describe: 'Name of the project',
          alias: 'n',
        })
    },
    (argv) => {
      console.log(argv)
    }
  )
  .command({
    command: 'list',
    describe: 'List local packages',
    aliases: ['ls', 'la', 'll'],
    builder: (yargs) => {},
    handler: (argv) => {
      console.log(argv)
    }
  })
  .argv
