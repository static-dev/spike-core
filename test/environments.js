const fs = require('fs')
const path = require('path')
const test = require('ava')
const {compileFixture} = require('./_helpers')

test('environment config parsed correctly', (t) => {
  return compileFixture(t, 'environments', { env: 'doge' }).then(({publicPath}) => {
    const src = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.is(src.trim(), '<p>true+true</p>')
  })
})
