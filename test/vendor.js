const test = require('ava')
const path = require('path')
const rimraf = require('rimraf')
const {fs, compileFixture, fixturesPath} = require('./_helpers')

test.cb.beforeEach((t) => {
  rimraf(path.join(fixturesPath, 'vendor', 'public'), () => { t.end() })
})

test('properly vendors specified files', (t) => {
  return compileFixture(t, 'vendor').then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'keep/file.js'), 'utf8')
  }).then((contents) => {
    return t.is(contents, 'vendored')
  })
})
