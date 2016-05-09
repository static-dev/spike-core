const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('injects template locals', (t) => {
  return compileFixture(t, 'locals', { locals: { foo: () => 'bar' } }).then(({publicPath}) => {
    return fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  }).then((contents) => {
    return t.is(contents, 'bar')
  })
})
