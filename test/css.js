import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('css plugin works', (t) => {
  return compileFixture(t, 'css')
    .then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((index) => { return fs.stat(index).tap(t.ok.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.regex(contents, /background: blue/) })
})
