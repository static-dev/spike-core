const test = require('ava')
const Spike = require('..')
const path = require('path')
const rimraf = require('rimraf')
const {EventEmitter} = require('events')
const {fixturesPath} = require('./_helpers')

test.cb('creates a new spike project', (t) => {
  const testPath = path.join(fixturesPath, 'new_test')
  const emitter = new EventEmitter()

  emitter.on('info', console.log) // just because this test takes forever
  emitter.on('error', t.fail)
  emitter.on('done', (project) => {
    t.is(project.config.context, testPath)
    rimraf(testPath, t.end)
  })
  Spike.new({ root: testPath, emitter: emitter,
    locals: {
      name: 'test',
      description: 'test',
      github_username: 'test'
    }
  })
})
