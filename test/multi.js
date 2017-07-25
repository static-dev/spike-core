const test = require('ava')
const path = require('path')
const fs = require('fs')
const exp = require('reshape-expressions')
const {compileFixture} = require('./_helpers')

test('compiles multi output templates correctly', (t) => {
  return compileFixture(t, 'multi', {
    reshape: {
      plugins: [exp()],
      multi: [
        { locals: { greeting: 'hello' }, name: 'index.en' },
        { locals: { greeting: 'hola' }, name: 'index.es.html' }
      ]
    }
  }).then(({res, publicPath}) => {
    const src1 = fs.readFileSync(path.join(publicPath, 'index.en.html'), 'utf8')
    const src2 = fs.readFileSync(path.join(publicPath, 'index.es.html'), 'utf8')
    t.is(src1.trim(), '<p>hello</p>')
    t.is(src2.trim(), '<p>hola</p>')
  })
})
