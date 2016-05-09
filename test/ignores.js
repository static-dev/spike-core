const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('does not compile ignored files', (t) => {
  return compileFixture(t, 'ignores', { ignore: ['**/layout.jade'] }).tap(({publicPath}) => {
    return fs.access(path.join(publicPath, 'index.html'))
  }).tap(({publicPath}) => {
    return fs.access(path.join(publicPath, 'about.html'))
  }).tap(({publicPath}) => {
    return t.throws(fs.access(path.join(publicPath, 'layout.html')))
  })
})
