const test = require('ava')
const fs = require('fs')
const path = require('path')
const {compileFixture} = require('./_helpers')
const customElements = require('posthtml-custom-elements')

test('compiles straight html using posthtml, tracks dependencies', (t) => {
  return compileFixture(t, 'html').then(({res}) => {
    const fd = res.stats.compilation.fileDependencies.map((d) => {
      return d.replace(`${res.stats.compilation.options.context}/`, '')
    })
    t.truthy(fd.indexOf('style.css') > -1)
  })
})

test('can apply posthtml plugins', (t) => {
  return compileFixture(t, 'html', {
    posthtml: { plugins: [customElements()] }
  }).then(({publicPath}) => {
    const index = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.truthy(index.match('div class="custom"'))
  })
})
