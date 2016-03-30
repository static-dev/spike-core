import CLI from '../lib/cli'
import {EventEmitter} from 'events'
import {test} from './_helpers'

let cli

// mock so that this only tests the CLI interface, not the roots tasks
class RootsMock extends EventEmitter {
  constructor (opts) {
    super()
    this.opts = opts
  }

  compile () {
    this.emit('compile', 'compile mock')
  }

  watch () {
    this.emit('compile', 'watch mock')
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
