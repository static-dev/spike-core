const test = require('ava')
const {compileFixture} = require('./_helpers')

test('tracks pug front-end dependencies', (t) => {
  return compileFixture(t, 'pug_dependencies').then(({res}) => {
    const fd = res.stats.compilation.fileDependencies.map((d) => {
      return d.replace(`${res.stats.compilation.options.context}/`, '')
    })
    t.truthy(fd.indexOf('image.jpg') > -1)
    t.truthy(fd.indexOf('style.css') > -1)
  })
})
