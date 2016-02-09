import {EventEmitter} from 'events'
import {ArgumentParser} from 'argparse'
import pkg from '../../package.json'

export default class CLI extends EventEmitter {
  constructor (opts = {}) {
    super()

    this.parser = new ArgumentParser({
      version: pkg.version,
      description: pkg.description,
      addHelp: true
    })

    this.sub = this.parser.addSubparsers()
  }

  run (args) {
    if (typeof args === 'string') { args = args.split(' ') }
    args = this.parser.parseArgs(args)

    let fn = require(`./${args.fn}`)
    delete args.fn

    let project

    try {
      project = fn(this, args)
    } catch (err) {
      this.emit('error', err)
    }

    return project
  }

  compile () {
    let s = this.sub.addParser('compile', { help: 'Compile a roots project' })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.addArgument(['--env', '-e'], {
      defaultValue: process.env['NODE_ENV'] || 'development',
      help: 'Your project\'s environment'
    })

    s.addArgument(['--verbose', '-v'], {
      action: 'storeTrue',
      help: 'Offer more verbose output and compile stats'
    })

    s.setDefaults({ fn: 'compile' })
  }
}
