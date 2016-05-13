const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('compiles a project with a custom plugin', (t) => {
  return compileFixture(t, 'plugins')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.truthy.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents, 'doge') })
})
