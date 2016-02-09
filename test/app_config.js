import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

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
