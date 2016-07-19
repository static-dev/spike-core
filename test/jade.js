const test = require('ava')
const path = require('path')
const fs = require('fs')
const jadePlugin = require('posthtml-jade')
const {compileFixture} = require('./_helpers')

test('works with jade plugin, tracks dependencies', (t) => {
  return compileFixture(t, 'jade', {
    matchers: { html: '**/*.jade' },
    posthtml: (ctx) => {
      return { plugins: [jadePlugin({ filename: ctx.requestPath, pretty: true })] }
    }
  }).then(({res, publicPath}) => {
    const index = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.truthy(index.match('<p>oh hello!</p>'))
    const fd = res.stats.compilation.fileDependencies.map((d) => {
      return d.replace(`${res.stats.compilation.options.context}/`, '')
    })
    t.truthy(fd.indexOf('image.jpg') > -1)
    t.truthy(fd.indexOf('style.css') > -1)
  })
})
