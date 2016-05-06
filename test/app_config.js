const test = require('ava')
const path = require('path')
const {fs, compileFixture} = require('./_helpers')

test('uses app.js configuration', (t) => {
  return compileFixture(t, 'app_config').then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  }).then((contents) => {
    return t.is(contents, 'override')
  })
})

test('API config overrides app.js config', (t) => {
  return compileFixture(t, 'app_config', { locals: { foo: 'double override' } }).then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  }).then((contents) => {
    return t.is(contents, 'double override')
  })
})

test('Throws error for invalid app.js syntax', (t) => {
  return t.throws(() => compileFixture(t, 'app_config_error'), /test\/fixtures\/app_config_error\/app\.js: Unexpected token \(1:4\)/)
})
