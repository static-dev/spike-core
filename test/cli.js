import CLI from '../lib/cli'
import {EventEmitter} from 'events'
import {test} from './_helpers'

let cli

// mock so that this only tests the CLI interface, not the roots tasks
class RootsMock extends EventEmitter {
  constructor (opts) {
    super()
    this.opts = opts
    this.config = {}
    this.config.context = 'test'
  }

  compile () {
    this.emit('compile', 'compile mock')
  }

  watch () {
    this.emit('compile', 'watch mock')
  }

  static new (opts) {
    opts.emitter.emit('done', new this())
  }
}

test.before((t) => {
  CLI.__Rewire__('Roots', RootsMock)
  cli = new CLI()
})

test.cb('compile', (t) => {
  t.ok(cli)

  cli.on('error', t.end)
  cli.on('warning', t.end)
  cli.on('compile', (res) => {
    t.is(res, 'compile mock')
    t.end()
  })

  cli.run('compile')
})

test.cb('new', (t) => {
  t.ok(cli)

  cli.on('error', t.end)
  cli.on('warning', t.end)
  cli.on('success', (res) => {
    t.ok(res.match(/project created at.*test/))
    t.end()
  })

  cli.run('new test')
})

test.skip('watch', (t) => {
  t.ok(cli)

  cli.on('error', t.end)
  cli.on('warning', t.end)
  cli.on('compile', (res) => {
    t.is(res, 'compile mock')
    t.end()
  })

  cli.run('watch')
})
