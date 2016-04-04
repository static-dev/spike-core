import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('css plugin works with .css', (t) => {
  return compileFixture(t, 'css')
    .then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((base) => { return fs.stat(base).tap(t.ok.bind(t)) })
    .then((base) => { return fs.readFile(base, 'utf8') })
    .then((contents) => { return t.regex(contents, /color: pink/) })
})

test('css plugin works with .sss', (t) => {
  return compileFixture(t, 'sugarss')
    .then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((index) => { return fs.stat(index).tap(t.ok.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.regex(contents, /background: blue/) })
})
