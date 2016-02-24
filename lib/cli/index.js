import {EventEmitter} from 'events'
import {ArgumentParser} from 'argparse'
import Roots from '..'
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
    this.addWatch()
  }

  run (args) {
    if (typeof args === 'string') { args = args.split(' ') }
    args = this.parser.parseArgs(args)

    const fn = require(`./${args.fn}`).default
    delete args.fn

    let project

    try {
      project = new Roots({ root: args.path, server: { port: args.port } })
    } catch (err) {
      return this.emit('error', err)
    }

    project.on('error', this.emit.bind(this, 'error'))
    project.on('warning', this.emit.bind(this, 'warning'))
    project.on('compile', this.emit.bind(this, 'compile'))

    fn(project)

    return this
  }

  addCompile () {
    const s = this.sub.addParser('compile', { help: 'Compile a roots project' })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.setDefaults({ fn: 'compile' })
  }

  addWatch () {
    const s = this.sub.addParser('watch', { help: 'Watch a roots project and compile any time there are changes to a file' })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.addArgument(['--port', '-p'], {
      type: Number,
      defaultValue: 1111,
      help: 'Port you want to run the local server on (default 1111)'
    })

    s.setDefaults({ fn: 'watch' })
  }
}
