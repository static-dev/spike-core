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

    this.addCompile()
  }

  run (args) {
    if (typeof args === 'string') { args = args.split(' ') }
    args = this.parser.parseArgs(args)

    let fn = require(`./${args.fn}`).default
    delete args.fn

    let project

    try {
      project = fn(this, args)
    } catch (err) {
      this.emit('error', err)
    }

    project
      .then((res) => { console.log(res); this.emit('data', res) })
      .catch((err) => { console.log(err); this.emit('error', err) })

    return this
  }

  addCompile () {
    let s = this.sub.addParser('compile', { help: 'Compile a roots project' })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.setDefaults({ fn: 'compile' })
  }
}
