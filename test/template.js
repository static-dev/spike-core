const test = require('ava')
const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const {fixturesPath} = require('./_helpers')
const Spike = require('..')

test.before((t) => { Spike.template.reset() })
test.after((t) => { Spike.template.reset() })

test.cb('template.add adds a template', (t) => {
  const emitter = new EventEmitter()

  emitter.on('info', console.log)

  emitter.on('done', (res) => {
    t.truthy(res === 'template "test" added')
    t.truthy(Object.keys(Spike.template.list()).indexOf('test') > -1)
    t.end()
  })

  Spike.template.add({
    name: 'test',
    src: 'https://github.com/jescalan/sprout-test-template',
    emitter: emitter
  })
})

test.cb('template.remove gets rid of a template', (t) => {
  const e1 = new EventEmitter()
  const e2 = new EventEmitter()

  e1.on('info', console.log)
  e2.on('info', console.log)

  e1.on('done', (res) => {
    Spike.template.remove({ name: 'test', emitter: e2 })
  })

  e2.on('done', (res) => {
    t.truthy(res === 'template "test" removed')
    t.falsy(Object.keys(Spike.template.list()).indexOf('test') > -1)
    t.end()
  })

  Spike.template.add({
    name: 'test',
    src: 'https://github.com/jescalan/sprout-test-template',
    emitter: e1
  })
})

test.cb('template.default sets the default template', (t) => {
  const e1 = new EventEmitter()
  const e2 = new EventEmitter()
  const e3 = new EventEmitter()
  const testPath = path.join(fixturesPath, 'new_test')

  e1.on('info', console.log)
  e2.on('info', console.log)
  e3.on('info', console.log)

  e1.on('done', (res) => {
    Spike.template.default({ name: 'test', emitter: e2 })
  })

  e2.on('done', (res) => {
    t.truthy(res === 'template "test" is now the default')
    Spike.new({
      root: testPath,
      locals: { foo: 'bar' },
      emitter: e3
    })
  })

  e3.on('done', (res) => {
    t.truthy(res.config.context, testPath)
    const content = fs.readFileSync(path.join(testPath, 'index.html'), 'utf8')
    t.truthy(content.trim() === '<p>basic template: bar</p>')
    rimraf(testPath, t.end)
  })

  Spike.template.add({
    name: 'test',
    src: 'https://github.com/jescalan/sprout-test-template',
    emitter: e1
  })
})
