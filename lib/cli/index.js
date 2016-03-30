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
    this.addClean()
    this.addNew()
  }

  run (args) {
    if (typeof args === 'string') { args = args.split(' ') }
    args = this.parser.parseArgs(args)

    const fn = require(`./${args.fn}`).default
    delete args.fn

    // all CLI modules must return an event emitter of some sort
    // they should also wait to execute anything until nextTick
    const emitter = fn(Roots, args)

    emitter.on('error', this.emit.bind(this, 'error'))
    emitter.on('warning', this.emit.bind(this, 'warning'))
    emitter.on('compile', this.emit.bind(this, 'compile'))
    emitter.on('remove', this.emit.bind(this, 'success'))
    emitter.on('create', this.emit.bind(this, 'success'))
    emitter.on('info', this.emit.bind(this, 'info'))

    return this
  }

  addCompile () {
    const s = this.sub.addParser('compile', {
      help: 'Compile a roots project'
    })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.setDefaults({ fn: 'compile' })
  }

  addWatch () {
    const s = this.sub.addParser('watch', {
      help: 'Watch a roots project and compile any time there are changes to a file'
    })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to compile'
    })

    s.addArgument(['--port', '-p'], {
      type: Number,
      help: 'Port you want to run the local server on (default 1111)'
    })

    s.setDefaults({ fn: 'watch' })
  }

  addClean () {
    const s = this.sub.addParser('clean', {
      help: 'Removes the output directory of a roots project'
    })

    s.addArgument(['path'], {
      nargs: '?',
      defaultValue: process.cwd(),
      help: 'Path to a project that you would like to remove'
    })

    s.setDefaults({ fn: 'clean' })
  }

  addNew () {
    const s = this.sub.addParser('new', {
      help: 'Creates a new roots project from a template'
    })

    s.addArgument(['path'], {
      help: 'Where to create your project'
    })

    s.addArgument(['--template', '--tpl', '-t'], {
      help: 'The template to use for your project. See "roots tpl" for more.'
    })

    s.addArgument(['--overrides', '-o'], {
      type: keyVal,
      help: "Pass information directly to the template without answering questions. Accepts a quoted comma-separated key-value list, like 'a: b, c: d'"
    })

    s.setDefaults({ fn: 'new' })
  }
}

/**
 * A simple csv-like string to object parser. Takes in "foo: bar, baz: quux",
 * and outputs a javascript object.
 *
 * @param {String} str - input string
 * @return {Object} javascript object output
*/
function keyVal (str) {
  return str.split(',').reduce((m, i) => {
    const s = i.split(':').map((i) => i.trim())
    m[s[0]] = s[1]
    return m
  }, {})
}
