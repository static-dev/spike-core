const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('does not compile ignored files', (t) => {
  return compileFixture(t, 'ignores', { ignore: ['ignore.html'] }).tap(({publicPath}) => {
    return fs.access(path.join(publicPath, 'index.html'))
  }).tap(({publicPath}) => {
    return t.throws(fs.access(path.join(publicPath, 'ignore.html')))
  })
})
