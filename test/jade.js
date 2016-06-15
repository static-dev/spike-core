const test = require('ava')
const path = require('path')
const fs = require('fs')
const url = require('url')
const jadePlugin = require('posthtml-jade')
const {compileFixture} = require('./_helpers')

test('works with jade plugin, tracks dependencies', (t) => {
  return compileFixture(t, 'jade', {
    matchers: { html: '**/*.+(html|jade)' },
    posthtml: (ctx) => {
      const path = url.parse(ctx.request.split('!').slice(-1)[0]).pathname
      return { defaults: [jadePlugin({ filename: path, pretty: true })] }
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
