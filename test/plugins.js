import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('compiles a project with a custom plugin', (t) => {
  return compileFixture(t, 'plugins')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.ok.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents, 'doge') })
})
