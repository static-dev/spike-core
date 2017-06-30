const test = require('ava')
const path = require('path')
const EventEmitter = require('events')
const webpack = require('webpack')
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

test('works with scope hoisting', (t) => {
  return compileFixture(t, 'scope_hoisting', {
    entry: { main: './index.js' },
    plugins: [new webpack.optimize.ModuleConcatenationPlugin()]
  }).then(({res, publicPath}) => {
    return fs.readFile(path.join(publicPath, 'main.js'), 'utf8')
      .then((src) => {
        t.regex(src, /\/\/ CONCATENATED MODULE: \.\/util\.js/)
      })
  })
})
