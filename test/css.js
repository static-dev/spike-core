import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('css plugin works', t => {
  return compileFixture(t, 'css').then(res => {
    return fs.stat(path.join(res.publicPath, 'main.css'))
  }).then(t.ok.bind(t))
})
