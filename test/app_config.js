import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('does not compile ignored files', (t) => {
  return compileFixture(t, 'app_config').then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  }).then((contents) => {
    return t.is(contents, 'override')
  })
})
