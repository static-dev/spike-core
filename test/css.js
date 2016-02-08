import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('css plugin works', (t) => {
  return compileFixture(t, 'css').then(({publicPath}) => {
    return fs.stat(path.join(publicPath, 'main.css'))
  }).then(t.ok.bind(t))
})
