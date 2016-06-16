const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('compiles a project with a custom plugin', (t) => {
  return compileFixture(t, 'plugins')
    .then(({res, publicPath}) => {
      const index = path.join(publicPath, 'index.html')
      fs.statSync(index)
      t.truthy(res.stats.compilation.options.test === 'bar')
    })
})
