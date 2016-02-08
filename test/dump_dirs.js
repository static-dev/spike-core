import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('discards directories, but keeps the directory\'s files', (t) => {
  return compileFixture(t, 'dump_dirs')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.ok.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents, '\n<p>hello world!</p>') })
})
