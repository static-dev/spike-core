import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('does not compile ignored files', t => {
  return compileFixture(t, 'ignores').tap(({publicPath}) => {
    return fs.access(path.join(publicPath, 'index.html'))
  }).tap(({publicPath}) => {
    return fs.access(path.join(publicPath, 'about.html'))
  }).tap(({publicPath}) => {
    return t.throws(fs.access(path.join(publicPath, 'layout.html')))
  })
})
