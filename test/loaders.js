const test = require('ava')
const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const {compileFixture, fixturesPath} = require('./_helpers')

test.cb.beforeEach((t) => {
  rimraf(path.join(fixturesPath, 'loaders', 'public'), () => { t.end() })
})

test('compiles a project with a custom loader', (t) => {
  return compileFixture(t, 'loaders')
    .then(({publicPath}) => {
      const mainJs = path.join(publicPath, 'js/main.js')
      try { fs.accessSync(mainJs) } catch (e) { t.fail(e) }
      t.regex(fs.readFileSync(mainJs, 'utf8'), /overwritten from local loader/)

      const fooFile = path.join(publicPath, 'js/foo.foo')
      try { fs.accessSync(fooFile) } catch (e) { t.fail(e) }
      t.regex(fs.readFileSync(fooFile, 'utf8'), /overwritten from local loader/)
    })
})

test('custom loader and skipSpikeProcessing option', (t) => {
  return compileFixture(t, 'skipSpikeProcessing')
    .then(({publicPath}) => {
      const mainJs = path.join(publicPath, 'js/main.js')
      try { fs.accessSync(mainJs) } catch (e) { t.fail(e) }
      t.regex(fs.readFileSync(mainJs, 'utf8'), /overwritten from local loader/)

      const fooFile = path.join(publicPath, 'js/foo.foo')
      t.throws(() => fs.accessSync(fooFile))
    })
})

test('custom loader with extension option', (t) => {
  return compileFixture(t, 'loader_custom_ext')
    .then(({publicPath}) => {
      const src = fs.readFileSync(path.join(publicPath, 'js/foo.txt'), 'utf8')
      t.is(src, 'overwritten from local loader')
    })
})

test('custom loader with incompatible return produces error', (t) => {
  return compileFixture(t, 'loader_source_error')
    .then(() => { t.fail('no error produced') })
    .catch((err) => {
      t.truthy(err.message.toString().match(/Module build failed/))
    })
})
