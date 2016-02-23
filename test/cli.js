import CLI from '../lib/cli'
import {EventEmitter} from 'events'
import { test } from './_helpers'

// mock so that this only tests the CLI interface, not the roots tasks
class RootsMock extends EventEmitter {
  constructor (opts) {
    super()
    console.log('mock initialized')
    this.opts = opts
  }

  compile () {
    this.emit('compile', 'mock!')
  }
}

test.before((t) => {
  CLI.__Rewire__('Roots', RootsMock)
})

test.cb('compile', (t) => {
  const cli = new CLI()
  t.ok(cli)

  cli.on('error', t.end)
  cli.on('warning', t.end)
  cli.on('compile', (res) => {
    t.is(res, 'mock!')
    t.end()
  })

  cli.run('compile')
})
