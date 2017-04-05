const test = require('ava')
const fs = require('fs')
const path = require('path')
const {compileFixture} = require('./_helpers')
const customElements = require('reshape-custom-elements')

test('compiles straight html using reshape', (t) => {
  return compileFixture(t, 'html', { reshape: { locals: {} } })
    .then(({res, publicPath}) => {
      const src = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
      t.truthy(compress(src) === '<head><title>test</title><link rel="stylesheet" href="style.css"></head><body><custom>hello there</custom></body>')
    })
})

test('can apply reshape plugins', (t) => {
  return compileFixture(t, 'html', {
    reshape: { plugins: [customElements()], locals: {} }
  }).then(({publicPath}) => {
    const src = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.truthy(compress(src) === '<head><title>test</title><link rel="stylesheet" href="style.css"></head><body><div class="custom">hello there</div></body>')
  })
})

function compress (html) {
  return html.replace(/>[\n|\s]*/g, '>')
}
