const test = require('ava')
const {compileFixture} = require('./_helpers')

test('uses app.js configuration', (t) => {
  return compileFixture(t, 'app_config').then(({res}) => {
    t.truthy(res.stats.compilation.options.testing.foo === 'override')
  })
})

test('API config overrides app.js config', (t) => {
  return compileFixture(t, 'app_config', { testing: { foo: 'double override' } }).then(({res}) => {
    t.truthy(res.stats.compilation.options.testing.foo === 'double override')
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

test('postcss and css querystring options', (t) => {
  return compileFixture(t, 'app_config', {
    postcss: { plugins: ['wow'], foo: 'bar' },
    css: { foo: 'bar' }
  }).then(({res}) => {
    const opts = res.stats.compilation.options
    t.truthy(opts.spike.postcssQuery.foo, 'bar')
    t.truthy(opts.spike.css.foo, 'bar')
    const cssLoaderConfig = opts.module.loaders.find((l) => l._core === 'css')
    t.truthy(cssLoaderConfig.loader === 'css-loader?foo=bar!postcss-loader?foo=bar')
  })
})
