const test = require('ava')
const {compileFixture} = require('./_helpers')

test.only('uses app.js configuration', (t) => {
  return compileFixture(t, 'app_config').then(({res}) => {
    t.truthy(res.stats.compilation.options.entry.foo[0] === 'override')
  })
})

test('API config overrides app.js config', (t) => {
  return compileFixture(t, 'app_config', { testing: { foo: 'double override' } }).then(({res}) => {
    t.truthy(res.stats.compilation.options.testing.foo === 'double override')
  })
})

test('API config merges properly with app.js config', (t) => {
  return compileFixture(t, 'app_config', { testing: { bar: 'double override' } }).then(({res}) => {
    t.truthy(res.stats.compilation.options.testing.baz === 'override')
    t.truthy(res.stats.compilation.options.testing.bar === 'double override')
  })
})

test('throws error for invalid app.js syntax', (t) => {
  return t.throws(() => compileFixture(t, 'app_config_error'), /Error: wow/)
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

test('postcss querystring options', (t) => {
  return compileFixture(t, 'app_config', {
    postcss: { plugins: ['wow'], foo: 'bar' },
    css: { foo: 'bar' }
  }).then(({res}) => {
    const opts = res.stats.compilation.options
    t.truthy(opts.spike.postcssQuery.foo, 'bar')
    t.truthy(opts.spike.css.foo, 'bar')
    const cssLoaderConfig = opts.module.loaders.find((l) => l._core === 'css')
    t.truthy(cssLoaderConfig.loader === 'source-loader!postcss-loader?foo=bar')
  })
})

test('allows typeof string for entry object\'s value', (t) => {
  return compileFixture(t, 'app_config', {entry: { 'js/main': './js/index.js' }})
    .then(({res}) => {
      t.truthy(Array.isArray(res.stats.compilation.options.entry['js/main']))
    })
})
