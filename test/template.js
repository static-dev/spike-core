const test = require('ava')
const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const {fixturesPath, debug} = require('./_helpers')
const Spike = require('..')

test.before((t) => { Spike.template.reset() })
test.afterEach((t) => { Spike.template.reset() })

test.cb('template.add adds a template', (t) => {
  const emitter = new EventEmitter()

  emitter.on('info', debug)

  emitter.on('success', (res) => {
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

  e1.on('info', debug)
  e2.on('info', debug)

  e1.on('success', (res) => {
    Spike.template.remove({ name: 'test', emitter: e2 })
  })

  e2.on('success', (res) => {
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

  e1.on('info', debug)
  e2.on('info', debug)
  e3.on('info', debug)

  e1.on('success', (res) => {
    Spike.template.default({ name: 'test', emitter: e2 })
  })

  e2.on('success', (res) => {
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

test.cb('template.default errors if template has not been added', (t) => {
  const emitter = new EventEmitter()

  emitter.on('error', (res) => {
    t.truthy(res === 'template "test" doesn\'t exist')
    t.end()
  })

  Spike.template.default({ name: 'test', emitter: emitter })
})

test('default function works without an emitter', (t) => {
  const res = Spike.template.default({ name: 'test' })
  t.truthy(res === 'template "test" doesn\'t exist')
})
