import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('injects template locals', t => {
  return compileFixture(t, 'locals').then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  }).then(contents => {
    return t.is(contents, 'bar')
  })
})
