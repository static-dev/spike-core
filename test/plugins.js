const test = require('ava')
const path = require('path')
const EventEmitter = require('events')
const AfterPlugin = require('./fixtures/plugins/after_plugin')
const {compileFixture, fs} = require('./_helpers')

test('compiles a project with a custom plugin, plugins can change output path', (t) => {
  t.plan(2)
  const emitter = new EventEmitter()
  emitter.on('check', (val) => { t.is(val, true) })
  return compileFixture(t, 'plugins', {
    afterSpikePlugins: [new AfterPlugin({ emitter })]
  }).then(({res, publicPath}) => {
    const index = path.join(publicPath, 'index.html')
    const outputChanged = path.join(publicPath, 'changed_output.html')
    fs.statSync(index)
    fs.statSync(outputChanged)
    t.truthy(res.stats.compilation.options.entry.test === 'bar')
  })
})
