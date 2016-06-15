const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('discards directories, but keeps the directory\'s files', (t) => {
  return compileFixture(t, 'dump_dirs')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.truthy.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents.trim(), '<p>hello world!</p>') })
})
