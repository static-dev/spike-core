import {
  test,
  compileFixture,
  fixturesPath,
  fs,
  path,
  rimraf
} from './_helpers'

test.cb.beforeEach((t) => {
  rimraf(path.join(fixturesPath, 'loaders', 'public'), () => { t.end() })
})

test('compiles a project with a custom loader', (t) => {
  return compileFixture(t, 'loaders')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.ok.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents, 'doge') })
})
