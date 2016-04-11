import test from 'ava'
import Roots from '..'
import path from 'path'
import rimraf from 'rimraf'
import {EventEmitter} from 'events'
import {fixturesPath} from './_helpers'

test.cb('creates a new roots project', (t) => {
  const testPath = path.join(fixturesPath, 'new_test')
  const emitter = new EventEmitter()

  emitter.on('info', console.log) // just because this test takes forever
  emitter.on('error', t.fail)
  emitter.on('done', (project) => {
    t.is(project.config.context, testPath)
    rimraf(testPath, t.end)
  })
  Roots.new({ root: testPath, emitter: emitter,
    locals: {
      name: 'test',
      description: 'test',
      github_username: 'test'
    }
  })
})
