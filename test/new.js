const test = require('ava')
const Spike = require('..')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const EventEmitter = require('events')
const {fixturesPath, debug} = require('./_helpers')

const testPath = path.join(fixturesPath, 'new_test')

test.before(() => { Spike.template.reset() })
test.afterEach(() => { Spike.template.reset() })

test.cb('creates a new spike project', (t) => {
  const emitter = new EventEmitter()

  emitter.on('info', debug) // just because this test takes forever
  emitter.on('error', t.fail)
  emitter.on('done', (project) => {
    t.is(project.config.context, testPath)
    rimraf(testPath, t.end)
  })

  Spike.new({
    root: testPath,
    emitter: emitter,
    locals: {
      name: 'test',
      description: 'test',
      github_username: 'test',
      sugar: false,
      production: false
    }
  })
})

test.cb('creates a new project with a custom template', (t) => {
  const e1 = new EventEmitter()
  const e2 = new EventEmitter()

  e1.on('info', debug)
  e1.on('success', (res) => {
    Spike.new({
      root: testPath,
      emitter: e2,
      template: 'test',
      locals: {
        name: 'test',
        description: 'test',
        github_username: 'test',
        foo: 'bar'
      }
    })
  })

  e2.on('info', debug)
  e2.on('done', () => {
    const contents = fs.readFileSync(path.join(testPath, 'index.html'), 'utf8')
    t.truthy(contents.trim() === '<p>basic template: bar</p>')
    rimraf(testPath, t.end)
  })

  Spike.template.add({
    name: 'test',
    src: 'https://github.com/jescalan/sprout-test-template',
    emitter: e1
  })
})

test.cb('errors if trying to create a project with nonexistant template', (t) => {
  const emitter = new EventEmitter()

  emitter.on('error', (msg) => {
    t.truthy(msg === 'template "doge" has not been added to spike')
    t.end()
  })

  Spike.new({
    root: testPath,
    emitter: emitter,
    template: 'doge'
  })
})
