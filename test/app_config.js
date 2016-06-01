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

test('throws error for invalid app.js syntax', (t) => {
  return t.throws(() => compileFixture(t, 'app_config_error'), /SyntaxError: Unexpected token :/)
})

test('adds custom options to the webpack config object', (t) => {
  return compileFixture(t, 'app_config', { customOption: 'wow!' })
    .then(({res}) => {
      t.truthy(res.stats.compilation.options.customOption === 'wow!')
    })
})

test('does not allow certain options to be configured', (t) => {
  return compileFixture(t, 'app_config', { context: 'override!' })
    .then(({res}) => {
      t.truthy(res.stats.compilation.options.context !== 'override!')
    })
})
